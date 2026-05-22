package com.pluton.himnarioeav

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.RadioGroup
import android.widget.TextView
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.app.AppCompatDelegate
import androidx.preference.PreferenceFragmentCompat
import com.github.javiersantos.appupdater.AppUpdater
import com.github.javiersantos.appupdater.enums.Display
import com.github.javiersantos.appupdater.enums.UpdateFrom
import com.google.android.material.slider.Slider
import com.pluton.himnarioeav.dbConfiguracion.Config
import com.pluton.himnarioeav.dbConfiguracion.SettingsViewModel


class SettingsActivity : AppCompatActivity() {

    //BD
    private val viewModel:SettingsViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        //tema
        val themeValue = viewModel.getConfigById(1)?.value ?: R.style.Theme_Alabando

        val darkValue = viewModel.getConfigById(2)?.value ?: AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM

        val sizeValue = viewModel.getConfigById(3)?.value ?: 18

        val startValue = viewModel.getConfigById(4)?.value ?: 2

        super.onCreate(savedInstanceState)

        setTheme(themeValue)

        setContentView(R.layout.settings_activity)

        val radioGroupTemas = findViewById<RadioGroup>(R.id.radioGroupTemas)

        // Selecciona el tema actual en el RadioGroup
        when (themeValue) {
            R.style.Theme_Alabando -> radioGroupTemas.check(R.id.radioButtonTemaClaro)
            R.style.Theme_System -> radioGroupTemas.check(R.id.radioButtonTemaOscuro)
            R.style.Theme_Verde -> radioGroupTemas.check(R.id.radioButtonTemaVerde)
            else -> radioGroupTemas.check(R.id.radioButtonTemaClaro)
        }

        radioGroupTemas.setOnCheckedChangeListener { _, checkedId ->
            val temaSeleccionado = when (checkedId) {
                R.id.radioButtonTemaClaro -> R.style.Theme_Alabando
                R.id.radioButtonTemaOscuro -> R.style.Theme_System
                R.id.radioButtonTemaVerde -> R.style.Theme_Verde
                else -> R.style.Theme_Alabando
            }

            // Guardar el tema seleccionado
            viewModel.updateConfigInfo(Config(1,temaSeleccionado))

            // Reiniciar la app para aplicar el tema
            val intent = Intent(this, MainActivity::class.java)
            intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_NEW_TASK)
            startActivity(intent)
            finish()
        }

        val slider = findViewById<Slider>(R.id.slider)
        val textView = findViewById<TextView>(R.id.ejemplo)
        val sizeRestore = findViewById<Button>(R.id.sizerestore)

        // Listener para el slider
        slider.addOnChangeListener { _, value, _ ->
            textView.textSize = value // Establece el tamaño del texto dinámicamente
            viewModel.updateConfigInfo(Config(3, value.toInt())) // Guarda el valor como entero en la base de datos
        }

        // Establece el valor inicial del slider (debe ser Float)
        slider.value = sizeValue.toFloat() // Convertir a Float si sizeValue es Int

        // Listener para el botón de restaurar tamaño
        sizeRestore.setOnClickListener {
            slider.value = 18f // Restablece el valor del slider a 18
            viewModel.updateConfigInfo(Config(3, 18))
        }

        val radioGroupDark: RadioGroup = findViewById(R.id.radioGroupDark)

        // Selecciona el tema actual en el RadioGroup

        when (darkValue) {
            AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM -> radioGroupDark.check(R.id.ModoAuto)
            AppCompatDelegate.MODE_NIGHT_NO -> radioGroupDark.check(R.id.ModoClaro)
            AppCompatDelegate.MODE_NIGHT_YES -> radioGroupDark.check(R.id.ModoOscuro)
            else -> radioGroupDark.check(R.id.ModoAuto)
        }

        // Setear el comportamiento al seleccionar una opción en el RadioGroup
        radioGroupDark.setOnCheckedChangeListener { _, checkedId ->
            val DarkSeleccionado = when (checkedId) {
                R.id.ModoAuto -> AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM
                R.id.ModoClaro -> AppCompatDelegate.MODE_NIGHT_NO
                R.id.ModoOscuro -> AppCompatDelegate.MODE_NIGHT_YES
                else -> AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM
            }

            // Guardar el tema seleccionado
            viewModel.updateConfigInfo(Config(2,DarkSeleccionado))

            // Reiniciar la app para aplicar el tema
            val intent = Intent(this, MainActivity::class.java)
            intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_NEW_TASK)
            startActivity(intent)
            finish()
        }

        //INICIO O BUSCAR

        val radioGroupInicio: RadioGroup = findViewById(R.id.radioGroupInicio)

        // Setear el comportamiento al seleccionar una opción en el RadioGroup
        radioGroupInicio.setOnCheckedChangeListener { group, checkedId ->
            when (checkedId) {
                R.id.Home -> {
                    viewModel.updateConfigInfo(Config(4,1))
                }
                R.id.Buscar -> {
                    viewModel.updateConfigInfo(Config(4,2))
                }
            }
        }

        // Selecciona el inicio actual en el RadioGroup

        when (startValue) {
            1 -> radioGroupInicio.check(R.id.Home)
            2 -> radioGroupInicio.check(R.id.Buscar)
            else -> radioGroupInicio.check(R.id.Buscar)
        }

        val textViewVersion: TextView = findViewById(R.id.textViewVersion)

        // Obtener el nombre de la versión
        val versionName = packageManager.getPackageInfo(packageName, 0).versionName

        // Asignarlo al TextView
        textViewVersion.text = "v.$versionName"


        //COMPROBAR ACTUALIZACION

        val checkUpdateButton: Button = findViewById(R.id.btn_actualizacion)
        checkUpdateButton.setOnClickListener {
            AppUpdater(this)
                .setUpdateFrom(UpdateFrom.JSON)
                .setUpdateJSON("https://raw.githubusercontent.com/RagNok16/HimnarioEAV/refs/heads/main/alabando.json")
                .setTitleOnUpdateNotAvailable("Actualización no disponible")
                .setContentOnUpdateNotAvailable("No hay actualizaciones disponibles. ¡Comprueba si hay actualizaciones más tarde!")
                .setDisplay(Display.DIALOG) // Puedes elegir DIALOG, NOTIFICATION, etc.
                .showAppUpdated(true)
                .start()
        }
    }

    class SettingsFragment : PreferenceFragmentCompat() {
        override fun onCreatePreferences(savedInstanceState: Bundle?, rootKey: String?) {
            setPreferencesFromResource(R.xml.root_preferences, rootKey)
        }
    }

}