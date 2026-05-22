package com.pluton.himnarioeav.ui.albumes

import Himno
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.inputmethod.InputMethodManager
import androidx.core.widget.doOnTextChanged
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.ViewModelProvider
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.search.SearchBar
import com.google.android.material.search.SearchView
import com.google.firebase.crashlytics.buildtools.reloc.com.google.common.reflect.TypeToken
import com.google.gson.Gson
import com.pluton.himnarioeav.BD.HimnoAdapter
import com.pluton.himnarioeav.R
import com.pluton.himnarioeav.bdFavoritos.FavoritosRoomAppDb
import com.pluton.himnarioeav.databinding.FragmentAlbumesBinding
import java.io.IOException

class AlbumesFragment : Fragment() {

    private lateinit var binding: FragmentAlbumesBinding
    private lateinit var adapter: CategoriaAdapter
    private lateinit var categoriasList: List<Categoria>

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        binding = FragmentAlbumesBinding.inflate(inflater, container, false)

        // Configurar RecyclerView
        binding.recyclerView.layoutManager = LinearLayoutManager(requireContext())

        // Cargar himnos desde JSON
        val himnos = cargarHimnosDesdeJson()

        // Procesar categorías
        categoriasList = obtenerCategorias(himnos)

        // Configurar adaptador
        adapter = CategoriaAdapter(categoriasList) { categoria ->
            abrirListaHimnosActivity(categoria)
        }
        binding.recyclerView.adapter = adapter

        return binding.root
    }

    private fun cargarHimnosDesdeJson(): List<Himno> {
        val inputStream = requireContext().assets.open("himnos.json")
        val json = inputStream.bufferedReader().use { it.readText() }

        // Convertir JSON a lista de himnos
        val gson = Gson()
        val himnoType = object : TypeToken<List<Himno>>() {}.type
        return gson.fromJson(json, himnoType)
    }

    private fun obtenerCategorias(himnosList: List<Himno>): List<Categoria> {
        // Agrupar himnos por categoría y contar
        val categoriasMap = himnosList.groupBy { it.categoria }
            .mapValues { it.value.size }

        // Convertir el mapa a lista de objetos `Categoria`
        val categorias = categoriasMap.map { (nombre, cantidad) ->
            Categoria(nombre, cantidad)
        }

        // Ordenar la lista asegurando que "Himnos Nuevos" esté primero
        return categorias.sortedWith(compareByDescending<Categoria> { it.nombre == "Himnos Nuevos" }
            .thenBy { it.nombre })
    }

    private fun abrirListaHimnosActivity(categoria: Categoria) {
        val intent = Intent(requireContext(), ListaHimnosActivity::class.java).apply {
            putExtra("categoriaNombre", categoria.nombre)
        }
        startActivity(intent)
    }
}
