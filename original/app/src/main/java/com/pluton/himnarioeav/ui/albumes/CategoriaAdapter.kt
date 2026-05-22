package com.pluton.himnarioeav.ui.albumes

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.pluton.himnarioeav.R

class CategoriaAdapter(
    private val categorias: List<Categoria>,
    private val onCategoriaClick: (Categoria) -> Unit
) : RecyclerView.Adapter<CategoriaAdapter.CategoriaViewHolder>() {

    class CategoriaViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val categoriaNombre: TextView = view.findViewById(R.id.categoriaNombre)
        val categoriaCantidad: TextView = view.findViewById(R.id.categoriaCantidad)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): CategoriaViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_categoria, parent, false)
        return CategoriaViewHolder(view)
    }

    override fun onBindViewHolder(holder: CategoriaViewHolder, position: Int) {
        val categoria = categorias[position]
        holder.categoriaNombre.text = categoria.nombre
        holder.categoriaCantidad.text = "${categoria.cantidad} himnos"

        holder.itemView.setOnClickListener {
            onCategoriaClick(categoria)
        }
    }

    override fun getItemCount(): Int = categorias.size
}
