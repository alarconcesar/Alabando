package com.pluton.himnarioeav.ui.favoritos

import Himno
import android.content.Context
import androidx.fragment.app.viewModels
import android.os.Bundle
import androidx.fragment.app.Fragment
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.lifecycle.ViewModelProvider
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.pluton.himnarioeav.BD.HimnoAdapter
import com.pluton.himnarioeav.databinding.FragmentFavoritosBinding
import com.pluton.himnarioeav.bdFavoritos.Favoritos
import com.pluton.himnarioeav.bdFavoritos.FavoritosRoomAppDb
import com.pluton.himnarioeav.bdFavoritos.FavoritosViewModel

class favoritosFragment : Fragment() {

    private var _binding: FragmentFavoritosBinding? = null
    private val binding get() = _binding!!

    private val viewModelF: FavoritosViewModel by viewModels()
    private lateinit var adapter: HimnoAdapter
    private var himnosList: List<Himno> = emptyList()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentFavoritosBinding.inflate(inflater, container, false)

        setupRecyclerView()
        loadHimnosAndObserveFavoritos()

        return binding.root
    }

    private fun setupRecyclerView() {
        binding.recyclerView.layoutManager = LinearLayoutManager(requireContext())
        adapter = HimnoAdapter(himnosList, FavoritosRoomAppDb.getInstance(requireContext()).favoritosDao())
        binding.recyclerView.adapter = adapter
    }

    private fun loadHimnosAndObserveFavoritos() {
        himnosList = loadHimnosFromJson(requireContext())

        viewModelF.getAllFavoritosOrdered().observe(viewLifecycleOwner) { favoritosList ->
            if (!favoritosList.isNullOrEmpty()) {
                val sortedHimnos = getLastSortedHimnos(favoritosList)
                updateRecyclerView(sortedHimnos)
            } else {
                updateRecyclerView(emptyList())
            }
        }
    }

    private fun getLastSortedHimnos(favoritosList: List<Favoritos>): List<Himno> {
        val sortedFavoritos = favoritosList
            .filter { it.fid != 0 && it.value == 1 } // Filtrar por id válido y favoritos marcados
            .sortedBy { it.fechaAgregado }

        val sortedFavoritosIds = sortedFavoritos.map { it.fid }
        val sortedFavoritosIdsValue = sortedFavoritos.associateBy { it.fid }



        return himnosList
            .filter { it.id in sortedFavoritosIds }
            .sortedByDescending { sortedFavoritosIdsValue[it.id]?.fechaAgregado ?: 0 }
    }

    private fun updateRecyclerView(himnos: List<Himno>) {
        adapter.updateList(himnos)

        // Actualizar la cantidad de himnos en el TextView
        binding.cantidad.text = "${himnos.size} himnos"

        if (himnos.size == 0) {
            binding.recyclerView.visibility = View.GONE
            binding.vacio.visibility = View.VISIBLE
        }else{
            binding.recyclerView.visibility = View.VISIBLE
            binding.vacio.visibility = View.GONE
        }
    }

    private fun loadHimnosFromJson(context: Context): List<Himno> {
        return try {
            val jsonString = context.assets.open("himnos.json").bufferedReader().use { it.readText() }
            val listType = object : TypeToken<List<Himno>>() {}.type
            Gson().fromJson(jsonString, listType)
        } catch (e: Exception) {
            Toast.makeText(context, "Error al cargar himnos.", Toast.LENGTH_SHORT).show()
            emptyList()
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
