package com.pluton.himnarioeav

import Himno
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.content.pm.ActivityInfo
import android.content.res.Configuration
import android.os.Bundle
import android.text.Html
import android.view.View
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.activity.viewModels
// Se elimina: import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import com.github.barteksc.pdfviewer.PDFView
import com.google.android.material.dialog.MaterialAlertDialogBuilder // <-- AÑADE ESTE IMPORT
import com.google.android.material.slider.Slider
import com.google.android.material.snackbar.Snackbar
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.pierfrancescosoffritti.androidyoutubeplayer.core.customui.DefaultPlayerUiController
import com.pierfrancescosoffritti.androidyoutubeplayer.core.player.listeners.AbstractYouTubePlayerListener
import com.pierfrancescosoffritti.androidyoutubeplayer.core.player.options.IFramePlayerOptions
import com.pierfrancescosoffritti.androidyoutubeplayer.core.player.views.YouTubePlayerView
import com.pluton.himnarioeav.bdFavoritos.Favoritos
import com.pluton.himnarioeav.bdFavoritos.FavoritosViewModel
import com.pluton.himnarioeav.databinding.ActivityHimnoBinding
import com.pluton.himnarioeav.dbConfiguracion.Config
import com.pluton.himnarioeav.dbConfiguracion.SettingsViewModel
import com.pluton.himnarioeav.dbHistorial.Historial
import com.pluton.himnarioeav.dbHistorial.HistorialViewModel
import java.io.IOException
import java.util.regex.Pattern


class HimnoActivity : AppCompatActivity() {

    private var estrofas: List<String> = emptyList()
    private var estrofaIndex = 0

    private lateinit var binding: ActivityHimnoBinding
    private lateinit var himnosList: List<Himno>

    // YT
    private lateinit var youTubePlayerView: YouTubePlayerView

    private val viewModel: SettingsViewModel by viewModels()
    private val viewModelH: HistorialViewModel by viewModels()
    private val viewModelF: FavoritosViewModel by viewModels()


    override fun onCreate(savedInstanceState: Bundle?) {

        val themeValue = viewModel.getConfigById(1)?.value ?: R.style.Theme_Alabando
        val sizeValue = viewModel.getConfigById(3)?.value ?: 18

        super.onCreate(savedInstanceState)

        setTheme(themeValue)

        binding = ActivityHimnoBinding.inflate(layoutInflater)
        setContentView(binding.root)

        //cambiar a horizontal
        val btnLandscape = findViewById<Button>(R.id.horizontal)
        btnLandscape.setOnClickListener {
            requestedOrientation = if (resources.configuration.orientation == Configuration.ORIENTATION_PORTRAIT) {
                ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
            } else {
                ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
            }
        }

        fun loadHimnosFromJson(context: Context): List<Himno> {
            val jsonString: String
            try {
                jsonString = context.assets.open("himnos.json").bufferedReader().use { it.readText() }
            } catch (ioException: IOException) {
                ioException.printStackTrace()
                return emptyList()
            }

            val listType = object : TypeToken<List<Himno>>() {}.type
            return Gson().fromJson(jsonString, listType)
        }

        // Cargar los himnos desde el archivo JSON
        himnosList = loadHimnosFromJson(this)

        val himnoId = intent.getIntExtra("himnoId", 1)

        //Historial
        val historialSize = viewModelH.getHistorialById(0)
        val historialOpen = viewModelH.getHistorialById(himnoId)
        val newId = (historialSize?.value ?: 0) + 1
        val newOpen = (historialOpen?.open ?: 0) + 1
        viewModelH.insertHistorial(Historial(himnoId, newId, newOpen, fechaAgregado = System.currentTimeMillis()))
        viewModelH.insertHistorial(Historial(0, newId, 0, fechaAgregado = System.currentTimeMillis()))

        // Buscar el himno por ID
        val himno = himnosList.find { it.id == himnoId }

        if (himno != null) {
            binding.nombreHim.text = himno.nombre

            if (resources.configuration.orientation == Configuration.ORIENTATION_PORTRAIT) {
                // Expresión regular para encontrar bloques CORO (ajustable según tu formato)
                val pattern = Pattern.compile("(?m)^\\s*CORO\\s*\\n(.*?)\\n\\s\\n", Pattern.DOTALL)
                val matcher = pattern.matcher(himno.letra)

                var letraFormateada = himno.letra
                while (matcher.find()) {
                    val grupo = matcher.group(1) // Contenido dentro del bloque CORO
                    val grupoNegrita = "\n<b>$grupo</b>\n\n"
                    letraFormateada = letraFormateada.replace(matcher.group(), grupoNegrita)
                }

                // Expresión regular para encontrar bloques CORO (ajustable según tu formato)
                val pattern2 = Pattern.compile("(?m)^\\s*CORO\\s*\\n(.*)", Pattern.DOTALL)
                val matcher2 = pattern2.matcher(letraFormateada)

                var letraFormateada2 = letraFormateada
                while (matcher2.find()) {
                    val grupo2 = matcher2.group(1) // Contenido dentro del bloque CORO
                    val grupoNegrita2 = "\n<b>$grupo2</b>\n\n"
                    letraFormateada2 = letraFormateada2.replace(matcher2.group(), grupoNegrita2)
                }

                letraFormateada2 = letraFormateada2.replace("\n", "<br>")

                binding.letraHim.text = Html.fromHtml(letraFormateada2, Html.FROM_HTML_MODE_LEGACY)
                binding.letraHim.textSize = sizeValue.toFloat()
            } else {
                binding.letraHim.text = himno.letra
                binding.letraHim.textSize = sizeValue + 4.toFloat()
            }

            binding.nombreHim.textSize = sizeValue * 1.4.toFloat()
            binding.himnoNumero.text = himno.numero
        } else {
            Toast.makeText(this, "Himno no encontrado", Toast.LENGTH_SHORT).show()
            finish()
        }

        if (himno != null && himno.page.isNotEmpty() && himno.page != "" && himno.page != "none") {
            binding.partitura.visibility = View.VISIBLE
        } else {
            binding.partitura.visibility = View.GONE
        }

        //Abrir Partitura
        var partituraOn = 0
        binding.partitura.setOnClickListener {
            if (partituraOn == 0) {
                binding.pdfView.visibility = View.VISIBLE
                binding.scrollView.visibility = View.INVISIBLE
                partituraOn = 1
                if (himno != null && himno.page.isNotEmpty() && himno.page != "" && himno.page != "none") {
                    convertPageInput(himno.page)
                } else {
                    Toast.makeText(this, "partitura no encontrada", Toast.LENGTH_SHORT).show()
                    binding.partitura.visibility = View.GONE
                }
            } else {
                binding.pdfView.visibility = View.GONE
                binding.scrollView.visibility = View.VISIBLE
                partituraOn = 0
            }
        }

        //Anterior y Siguiente Himno
        binding.anterior.setOnClickListener {
            val intent = Intent(this, HimnoActivity::class.java)
            intent.putExtra("himnoId", himnoId - 1)
            startActivity(intent)
            overridePendingTransition(R.anim.slide_in_left, R.anim.slide_out_right)
            finish()
        }

        binding.siguiente.setOnClickListener {
            val intent = Intent(this, HimnoActivity::class.java)
            intent.putExtra("himnoId", himnoId + 1)
            startActivity(intent)
            overridePendingTransition(R.anim.slide_in_right, R.anim.slide_out_left)
            finish()
        }

        //compartir
        binding.compartir.setOnClickListener {
            val intent = Intent(Intent.ACTION_SEND)
            val shareletra = findViewById<TextView>(R.id.letra_him)
            val sharenombre = findViewById<TextView>(R.id.nombre_him)
            val sharenumero = findViewById<Button>(R.id.himnoNumero)
            val textoCompartir = "*${sharenumero.text} ${sharenombre.text}*\n\n${shareletra.text}"
            intent.putExtra(Intent.EXTRA_TEXT, textoCompartir)
            intent.type = "text/plain"
            startActivity(Intent.createChooser(intent, "Compartir por:"))
        }

        var playing = 0
        var youTubePlayerInstance: com.pierfrancescosoffritti.androidyoutubeplayer.core.player.YouTubePlayer? = null

        binding.video.setOnClickListener {
            // First, check if the player is already visible. If so, just hide it.
            if (binding.contenedorVideo.visibility == View.VISIBLE) {
                binding.contenedorVideo.visibility = View.GONE
                binding.play?.visibility = View.GONE
                youTubePlayerInstance?.pause()
                binding.play?.setImageResource(R.drawable.play)
                playing = 0
            } else {
                // If the player is hidden, decide how to show it.
                if (himno?.aud?.isNotEmpty() == true) {
                    // Case 1: More than one audio. Show the selection dialog.
                    if (himno.aud.size > 1) {
                        val languageOptions = himno.aud.map { getLanguageName(it.lang) }.toTypedArray()

                        // --- START OF MODIFIED CODE ---
                        // Use MaterialAlertDialogBuilder for Material 3 styling
                        MaterialAlertDialogBuilder(this)
                            // --- END OF MODIFIED CODE ---
                            .setTitle("Seleccionar audio")
                            .setItems(languageOptions) { _, which ->
                                val selectedAudioId = himno.aud[which].id
                                // Cue the video (load but DON'T play)
                                youTubePlayerInstance?.cueVideo(selectedAudioId, 0f)

                                // Show the player controls in a paused state
                                binding.contenedorVideo.visibility = View.VISIBLE
                                binding.play?.visibility = View.VISIBLE
                                binding.play?.setImageResource(R.drawable.play)
                                playing = 0
                            }
                            .show()
                    } else {
                        // Case 2: Only one audio. Just show the player.
                        binding.contenedorVideo.visibility = View.VISIBLE
                        binding.play?.visibility = View.VISIBLE
                    }
                }
            }
        }

        binding.play?.setOnClickListener {
            if (playing == 0) {
                youTubePlayerInstance?.play()
                binding.play?.setImageResource(R.drawable.baseline_pause_24)
                playing = 1
            } else {
                youTubePlayerInstance?.pause()
                binding.play?.setImageResource(R.drawable.play)
                playing = 0
            }
        }

        youTubePlayerView = binding.youtubePlayerView
        lifecycle.addObserver(youTubePlayerView)

        val listener = object : AbstractYouTubePlayerListener() {
            override fun onReady(youTubePlayer: com.pierfrancescosoffritti.androidyoutubeplayer.core.player.YouTubePlayer) {
                youTubePlayerInstance = youTubePlayer

                val defaultPlayerUiController = DefaultPlayerUiController(youTubePlayerView, youTubePlayer)
                defaultPlayerUiController.showFullscreenButton(false)
                defaultPlayerUiController.showPlayPauseButton(false)
                youTubePlayerView.setCustomPlayerUi(defaultPlayerUiController.rootView)

                if (himno?.aud?.isNotEmpty() == true) {
                    binding.video.visibility = View.VISIBLE
                } else {
                    binding.video.visibility = View.GONE
                }

                val videoId = if (himno?.aud?.isNotEmpty() == true) {
                    himno.aud[0].id
                } else {
                    "1qpCRkLA1Vg"
                }

                if (videoId.isNotEmpty()) {
                    youTubePlayer.cueVideo(videoId, 0f)
                } else {
                    Toast.makeText(this@HimnoActivity, "ID de video no válido", Toast.LENGTH_SHORT).show()
                }
            }
        }

        try {
            val options = IFramePlayerOptions.Builder(this).controls(0).build()
            youTubePlayerView.enableAutomaticInitialization = false
            youTubePlayerView.initialize(listener, options)
        } catch (e: Exception) {
            e.printStackTrace()
            Toast.makeText(this, "Error al inicializar el reproductor: ${e.message}", Toast.LENGTH_LONG).show()
            getSystemService(Context.CLIPBOARD_SERVICE)?.let {
                (it as ClipboardManager).setPrimaryClip(ClipData.newPlainText("label", e.message))
            }
            println("Error al inicializar el reproductor: ${e.message}")
        }

        binding.textoSize.setOnClickListener {
            binding.contenedorTexto.visibility = if (binding.contenedorTexto.visibility == View.VISIBLE) {
                View.GONE
            } else {
                View.VISIBLE
            }
        }

        val slider = findViewById<Slider>(R.id.slider)
        val textView = findViewById<TextView>(R.id.letra_him)
        val sizeRestore = findViewById<Button>(R.id.sizerestore)

        if (resources.configuration.orientation == Configuration.ORIENTATION_PORTRAIT) {
            slider.addOnChangeListener { _, value, _ ->
                textView.textSize = value
                viewModel.updateConfigInfo(Config(3, value.toInt()))
            }
            slider.value = sizeValue.toFloat()
            sizeRestore.setOnClickListener {
                slider.value = 18f
                viewModel.updateConfigInfo(Config(3, 18))
            }
        } else {
            slider.addOnChangeListener { _, value, _ ->
                textView.textSize = value + 4
                viewModel.updateConfigInfo(Config(3, value.toInt()))
            }
            slider.value = sizeValue.toFloat()
            sizeRestore.setOnClickListener {
                slider.value = 22f
                viewModel.updateConfigInfo(Config(3, 18))
            }
        }

        val favorito = himno?.let { viewModelF.getFavoritoById(it.id) }
        if (favorito?.value == 1) {
            binding.corazonOn.visibility = View.VISIBLE
            binding.corazonOff.visibility = View.GONE
        } else {
            binding.corazonOn.visibility = View.GONE
            binding.corazonOff.visibility = View.VISIBLE
        }

        binding.corazonOff.setOnClickListener {
            if (himno != null) {
                viewModelF.insertFavoritos(Favoritos(fid = himno.id, value = 1, fechaAgregado = System.currentTimeMillis()))
            }
            binding.corazonOn.visibility = View.VISIBLE
            binding.corazonOff.visibility = View.GONE
        }

        binding.corazonOn.setOnClickListener {
            himno?.let {
                viewModelF.insertFavoritos(Favoritos(fid = it.id, value = 0, fechaAgregado = System.currentTimeMillis()))
            }
            binding.corazonOn.visibility = View.GONE
            binding.corazonOff.visibility = View.VISIBLE

            val parentView = binding.root.rootView
            if (himno != null) {
                Snackbar.make(parentView, "Himno: ${himno.numero} ${himno.nombre}, fue eliminado de favoritos", Snackbar.LENGTH_LONG)
                    .setAction("Deshacer") {
                        himno.let {
                            viewModelF.insertFavoritos(Favoritos(fid = it.id, value = 1, fechaAgregado = System.currentTimeMillis()))
                        }
                        binding.corazonOn.visibility = View.VISIBLE
                        binding.corazonOff.visibility = View.GONE
                    }
                    .show()
            }
        }

        fun ocultar() {
            binding.contenedorTexto.visibility = View.GONE
        }

        binding.letraHim.setOnClickListener {
            ocultar()
        }
        binding.pdfView.setOnClickListener {
            ocultar()
        }

        if (resources.configuration.orientation == Configuration.ORIENTATION_LANDSCAPE) {
            val textoCompleto = binding.letraHim.text
            estrofas = textoCompleto.split(Regex("\n \n")).map { it.trim() }
            mostrarEstrofaActual()

            binding.anteriorEstrofa?.setOnClickListener {
                if (estrofaIndex > 0) {
                    estrofaIndex--
                    mostrarEstrofaActual()
                }
            }

            binding.siguienteEstrofa?.setOnClickListener {
                if (estrofaIndex < estrofas.lastIndex) {
                    estrofaIndex++
                    mostrarEstrofaActual()
                }
            }
        }
    }

    private fun getLanguageName(code: String): String {
        return when (code.lowercase()) {
            "es" -> "Español"
            "pt" -> "Portugués"
            "en" -> "Inglés"
            else -> code.uppercase()
        }
    }

    private fun mostrarEstrofaActual() {
        val pattern = Pattern.compile("(?m)^\\s*CORO\\s*\\n(.*)", Pattern.DOTALL)
        val matcher = pattern.matcher(estrofas[estrofaIndex])

        var letraFormateada = estrofas[estrofaIndex]
        while (matcher.find()) {
            val grupo = matcher.group(1)
            val grupoNegrita = "<b>$grupo</b>"
            letraFormateada = letraFormateada.replace(matcher.group(), grupoNegrita)
        }

        letraFormateada = letraFormateada.replace("\n", "<br>")
        binding.letraHim.text = Html.fromHtml(letraFormateada, Html.FROM_HTML_MODE_LEGACY)
    }

    fun convertPageInput(pages: String) {
        val pdfView = findViewById<PDFView>(R.id.pdfView)

        fun convertPageInput(page: String): IntArray {
            return page.split(",")
                .map { it.trim().toInt() - 1 }
                .toIntArray()
        }

        val convertedPages = convertPageInput(pages)

        pdfView.fromAsset("Partituras.pdf")
            .pages(*convertedPages)
            .enableDoubletap(true)
            .enableAntialiasing(true)
            .load()
    }



    override fun onDestroy() {
        super.onDestroy()
        youTubePlayerView.release()
    }
}