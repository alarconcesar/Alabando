package com.pluton.himnarioeav.BD

import Himno
import android.content.Intent
import android.text.Html
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.snackbar.Snackbar
import com.pluton.himnarioeav.HimnoActivity
import com.pluton.himnarioeav.R
import com.pluton.himnarioeav.bdFavoritos.Favoritos
import com.pluton.himnarioeav.bdFavoritos.FavoritosDao

class HimnoAdapterText(
    private var himnosList: List<Himno>,
    private var searchText: String,
    private val favoritosDao: FavoritosDao
) : RecyclerView.Adapter<HimnoAdapterText.HimnoViewHolder>() {

    class HimnoViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val numeroTextView: TextView = view.findViewById(R.id.himnoNumero)
        val nombreTextView: TextView = view.findViewById(R.id.himnoNombre)
        val categoriaTextView: TextView = view.findViewById(R.id.himnoCategoria)
        val video: ImageView = view.findViewById(R.id.video)
        val partitura: ImageView = view.findViewById(R.id.partitura)
        val himnoLetra: TextView = view.findViewById(R.id.himnoLetra)
        val corazonOff: Button = itemView.findViewById(R.id.corazonOff)
        val corazonOn: Button = itemView.findViewById(R.id.corazonOn)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): HimnoViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.himnos_list_text, parent, false)
        return HimnoViewHolder(view)
    }

    override fun onBindViewHolder(holder: HimnoViewHolder, position: Int) {
        val himno = himnosList[position]

        holder.numeroTextView.text = himno.numero

        // Resaltar coincidencias en el nombre (sin puntos suspensivos)
        val highlightedName = getHighlightedName(himno.nombre, searchText)
        holder.nombreTextView.text = Html.fromHtml(highlightedName)

        holder.categoriaTextView.text = himno.categoria

        // Resaltar coincidencias en la letra o mostrar la primera línea si no hay coincidencias
        val highlightedLyric = getHighlightedLyric(himno.letra, searchText)
        holder.himnoLetra.text = Html.fromHtml(highlightedLyric)

        holder.video.visibility = if (himno.aud != null && himno.aud.any { it.id.isNotEmpty() && it.id != "none" }) {
            View.VISIBLE
        } else {
            View.GONE
        }

        holder.partitura.visibility = if (himno.page != null && himno.page.isNotEmpty() && himno.page != "none") {
            View.VISIBLE
        } else {
            View.GONE
        }

        holder.itemView.setOnClickListener {
            val context = holder.itemView.context
            val intent = Intent(context, HimnoActivity::class.java).apply {
                putExtra("himnoId", himno.id)
            }
            context.startActivity(intent)
            if (context is androidx.appcompat.app.AppCompatActivity) {
                context.overridePendingTransition(R.anim.slide_in_bottom, R.anim.slide_out_top)
            }
        }

        // Consultar si el himno está en favoritos
        val favorito = favoritosDao.getFavoritoById(himno.id) // Esto devuelve un Favorito o null
        if (favorito?.value == 1) {
            holder.corazonOn.visibility = View.VISIBLE
            holder.corazonOff.visibility = View.GONE
        } else {
            holder.corazonOn.visibility = View.GONE
            holder.corazonOff.visibility = View.VISIBLE
        }

        // Acción al presionar corazonOff
        holder.corazonOff.setOnClickListener {
            // Agregar o actualizar el himno en la base de datos como favorito
            favoritosDao.insertOrUpdate(Favoritos(fid = himno.id, value = 1, fechaAgregado = System.currentTimeMillis()))

            holder.corazonOn.visibility = View.VISIBLE
            holder.corazonOff.visibility = View.GONE
        }

        // Acción al presionar corazonOn con Snackbar
        holder.corazonOn.setOnClickListener {
            // Eliminar favorito y mostrar Snackbar
            favoritosDao.insertOrUpdate(Favoritos(fid = himno.id, value = 0, fechaAgregado = System.currentTimeMillis()))
            holder.corazonOn.visibility = View.GONE
            holder.corazonOff.visibility = View.VISIBLE

            val parentView = holder.itemView.rootView // Referencia al contenedor principal
            val context = holder.itemView.context

            // Mostrar Snackbar
            Snackbar.make(parentView, "Himno: ${himno.numero} ${himno.nombre}, fue eliminado de favoritos", Snackbar.LENGTH_LONG)
                .setAction("Deshacer") {
                    // Restaurar el favorito
                    favoritosDao.insertOrUpdate(Favoritos(fid = himno.id, value = 1, fechaAgregado = System.currentTimeMillis()))
                    holder.corazonOn.visibility = View.VISIBLE
                    holder.corazonOff.visibility = View.GONE
                }
                .show()
        }
    }

    override fun getItemCount(): Int = himnosList.size

    fun updateList(newHimnos: List<Himno>, newSearchText: String) {
        himnosList = newHimnos
        searchText = newSearchText
        notifyDataSetChanged()
    }

    // Resaltar coincidencias en el nombre sin truncar
    private fun getHighlightedName(name: String, keyword: String): String {
        val normalizedText = name.normalize()
        val normalizedKeyword = keyword.normalize()
        val index = normalizedText.indexOf(normalizedKeyword, ignoreCase = true)

        return if (index != -1) {
            val highlighted = name.substring(0, index) +
                    "\"<b>${name.substring(index, index + keyword.length)}</b>\"" +
                    name.substring(index + keyword.length)
            highlighted
        } else {
            name // No hay coincidencias, mostrar el nombre completo
        }
    }

    // Resaltar coincidencias en la letra, mostrando la primera línea si no hay coincidencias
    private fun getHighlightedLyric(lyric: String, keyword: String): String {
        // Normalizamos solo para la comparación de búsqueda (para ignorar las tildes)
        val normalizedText = lyric.normalize()
        val normalizedKeyword = keyword.normalize()

        // Buscamos la coincidencia de manera insensible a tildes
        val index = normalizedText.indexOf(normalizedKeyword, ignoreCase = true)

        return if (index != -1) {
            // Si hay coincidencia, mostramos un fragmento con 20 caracteres antes y después de la coincidencia
            val start = maxOf(0, index - 20)
            val end = minOf(lyric.length, index + keyword.length + 20)
            val before = if (start > 0) "..." else ""
            val after = if (end < lyric.length) "..." else ""


            // Usamos el texto original para mantener el formato y solo resaltar la coincidencia
            val highlighted = lyric.substring(start, end)
                .replace(keyword, "<b>$keyword</b>", ignoreCase = true) // Resaltar la coincidencia en negrita

            "$before$highlighted$after" // Retornar el fragmento con los '...'
        } else {
            // Si no hay coincidencia, mostrar solo la primera línea
            val firstLine = lyric.lines().firstOrNull() ?: ""  // Obtener la primera línea de la letra
            "$firstLine..."  // Retornar la primera línea con '...'
        }
    }





    private fun String.normalize(): String {
        return this.lowercase()
            .replace("á", "a")
            .replace("é", "e")
            .replace("í", "i")
            .replace("ó", "o")
            .replace("ú", "u")
    }

    private fun String.containsIgnoreCase(other: String): Boolean {
        return this.normalize().contains(other.normalize())
    }
}
