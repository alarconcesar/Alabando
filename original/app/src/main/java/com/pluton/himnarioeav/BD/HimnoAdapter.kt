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

class HimnoAdapter(
    private var himnosList: List<Himno>,
    private val favoritosDao: FavoritosDao
) : RecyclerView.Adapter<HimnoAdapter.HimnoViewHolder>() {

    class HimnoViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val numeroTextView: TextView = view.findViewById(R.id.himnoNumero)
        val nombreTextView: TextView = view.findViewById(R.id.himnoNombre)
        val categoriaTextView: TextView = view.findViewById(R.id.himnoCategoria)
        val video: ImageView = view.findViewById(R.id.video)
        val partitura: ImageView = view.findViewById(R.id.partitura)
        val corazonOff: Button = itemView.findViewById(R.id.corazonOff)
        val corazonOn: Button = itemView.findViewById(R.id.corazonOn)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): HimnoViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.himnos_list, parent, false)
        return HimnoViewHolder(view)
    }

    override fun onBindViewHolder(holder: HimnoViewHolder, position: Int) {
        val himno = himnosList[position]

        holder.numeroTextView.text = himno.numero

        holder.nombreTextView.text = himno.nombre

        holder.categoriaTextView.text = himno.categoria

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

    override fun getItemCount(): Int {
        return himnosList.size // Devuelve el tamaño de la lista actual
    }

    fun updateList(newList: List<Himno>) {
        himnosList = newList
        notifyDataSetChanged()
    }
}
