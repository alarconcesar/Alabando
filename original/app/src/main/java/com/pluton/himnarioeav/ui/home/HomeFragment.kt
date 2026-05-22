package com.pluton.himnarioeav.ui.home

import Himno
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.activity.viewModels
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.ViewModelProvider
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.pluton.himnarioeav.BD.HimnoAdapter
import com.pluton.himnarioeav.HimnoActivity
import com.pluton.himnarioeav.HistorialActivity
import com.pluton.himnarioeav.NuevosActivity
import com.pluton.himnarioeav.R
import com.pluton.himnarioeav.SettingsActivity
import com.pluton.himnarioeav.bdFavoritos.FavoritosRoomAppDb
import com.pluton.himnarioeav.databinding.FragmentBuscarBinding
import com.pluton.himnarioeav.databinding.FragmentHomeBinding
import com.pluton.himnarioeav.dbHistorial.Historial
import com.pluton.himnarioeav.dbHistorial.HistorialViewModel
import java.io.IOException

class HomeFragment : Fragment() {

    private var _binding: FragmentHomeBinding? = null

    private lateinit var recyclerView: RecyclerView
    private lateinit var messageTextView: TextView
    private lateinit var adapter: HimnoAdapter
    private var himnosList: List<Himno> = emptyList()

    private lateinit var filteredList: List<Himno>

    private val viewModelH: HistorialViewModel by viewModels()

    // This property is only valid between onCreateView and
    // onDestroyView.
    private val binding get() = _binding!!

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {

        val homeViewModel =
            ViewModelProvider(this).get(HomeViewModel::class.java)

        _binding = FragmentHomeBinding.inflate(inflater, container, false)
        val root: View = binding.root

        // Configuración del RecyclerView
        setupRecyclerView(root)

        // Cargar himnos y observar cambios
        loadHimnosAndObserveHistorial()

        //val textView: TextView = binding.textHome
        homeViewModel.text.observe(viewLifecycleOwner) {
            //textView.text = it
        }

        //compartir App
        binding.compartirApp.setOnClickListener {
            val textoCompartir = "Con el himnario Alabando, puedes llevar todas los himnos contigo y adorar en cualquier momento y lugar.\n" +
                    "\n" +
                    "¡Únete y alabemos juntos! Descarga la app:\n" +
                    "\n" +
                    "https://drive.google.com/drive/folders/1uea_IdLU8EFvugLph6v8NvBA5AeNkoeF?usp=sharing"

            val intent = Intent(Intent.ACTION_SEND).apply {
                putExtra(Intent.EXTRA_TEXT, textoCompartir)
                type = "text/plain"
            }

            val chooser = Intent.createChooser(intent, "Compartir Alabando por:")
            startActivity(chooser)
        }

        binding.azar.setOnClickListener {
            // Cargar los himnos desde el JSON
            val himnosList = loadHimnosFromJson(requireContext())

            if (himnosList.isNotEmpty()) {
                // Generar un ID al azar
                val randomHimnoId = himnosList.random().id

                // Abrir la actividad con el himno al azar
                val intent = Intent(requireContext(), HimnoActivity::class.java)
                intent.putExtra("himnoId", randomHimnoId)
                startActivity(intent)
            } else {
                Toast.makeText(requireContext(), "No se encontraron himnos.", Toast.LENGTH_SHORT).show()
            }
        }

        binding.nuevos.setOnClickListener {
            val intent = Intent(requireContext(), NuevosActivity::class.java)
            startActivity(intent)
        }

        binding.historialCompleto.setOnClickListener {
            val intent = Intent(requireContext(), HistorialActivity::class.java)
            startActivity(intent)
        }


        return root
    }

    private fun setupRecyclerView(view: View) {
        recyclerView = view.findViewById(R.id.recyclerView)
        recyclerView.layoutManager = LinearLayoutManager(requireContext())
        adapter = HimnoAdapter(himnosList, FavoritosRoomAppDb.getInstance(requireContext()).favoritosDao()) // Usar requireContext()
        recyclerView.adapter = adapter
    }

    private fun loadHimnosAndObserveHistorial() {
        himnosList = loadHimnosFromJson(requireContext())

        // Observar cambios en el historial desde el ViewModel
        viewModelH.getAllHistorialOrdered().observe(viewLifecycleOwner) { historialList ->
            if (!historialList.isNullOrEmpty()) {
                val sortedHimnos = getLastSortedHimnos(historialList)
                updateRecyclerView(sortedHimnos)
                binding.lista.visibility = View.VISIBLE
                binding.vacio.visibility = View.GONE
            } else {
                binding.lista.visibility = View.GONE
                binding.vacio.visibility = View.VISIBLE
            }
        }
    }

    private fun getLastSortedHimnos(historialList: List<Historial>): List<Himno> {
        // Filtrar historial eliminando elementos con id = 0 y ordenar por value en orden descendente
        val sortedHistorial = historialList
            .filter { it.uid != 0 } // Excluir elementos con id = 0
            .sortedByDescending { it.value } // Ordenar por value (descendente)

        // Tomar los primeros 3 elementos del historial filtrado y ordenado
        val top3Historial = sortedHistorial.take(3)

        // Obtener los IDs y asociar valores de los 3 seleccionados
        val top3Ids = top3Historial.map { it.uid }
        val top3Values = top3Historial.associateBy { it.uid }

        // Filtrar los himnos que coincidan con los IDs seleccionados
        return himnosList
            .filter { it.id in top3Ids }
            .sortedByDescending { top3Values[it.id]?.value ?: 0 } // Ordenar según los valores de value
    }


    private fun updateRecyclerView(himnos: List<Himno>) {
        adapter.updateList(himnos)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Encontrar el botón y establecer el listener
        val buttonConfiguracion = requireView().findViewById<Button>(R.id.buttonConfiguracion)
        buttonConfiguracion.setOnClickListener {
            // Navegar a SettingsActivity
            val intent = Intent(requireActivity(), SettingsActivity::class.java)
            startActivity(intent)
        }

    }

    private fun loadHimnosFromJson(context: Context): List<Himno> {
        val jsonString: String
        try {
            jsonString = context.assets.open("himnos.json").bufferedReader().use { it.readText() }
        }  catch (e: Exception) {
            Toast.makeText(context, "Error al cargar himnos.", Toast.LENGTH_SHORT).show()
            return emptyList()
        }

        val listType = object : TypeToken<List<Himno>>() {}.type
        return Gson().fromJson(jsonString, listType)
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}