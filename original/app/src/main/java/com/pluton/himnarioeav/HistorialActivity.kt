package com.pluton.himnarioeav

import Himno
import android.content.Context
import android.os.Bundle
import android.widget.Toast
import androidx.activity.viewModels
import com.google.android.material.snackbar.Snackbar
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.ViewModelProvider
import androidx.navigation.findNavController
import androidx.navigation.ui.AppBarConfiguration
import androidx.navigation.ui.navigateUp
import androidx.navigation.ui.setupActionBarWithNavController
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.pluton.himnarioeav.BD.HimnoAdapter
import com.pluton.himnarioeav.BD.HimnoAdapterText
import com.pluton.himnarioeav.bdFavoritos.FavoritosRoomAppDb
import com.pluton.himnarioeav.databinding.ActivityHistorialBinding
import com.pluton.himnarioeav.dbConfiguracion.SettingsViewModel
import com.pluton.himnarioeav.dbHistorial.Historial
import com.pluton.himnarioeav.dbHistorial.HistorialViewModel

class HistorialActivity : AppCompatActivity() {

    private lateinit var recyclerView: RecyclerView
    private lateinit var adapter: HimnoAdapter
    private var himnosList: List<Himno> = emptyList()
    private lateinit var viewModelH: HistorialViewModel

    private val viewModel: SettingsViewModel by viewModels()

    private lateinit var binding: ActivityHistorialBinding

    override fun onCreate(savedInstanceState: Bundle?) {

        val themeValue = viewModel.getConfigById(1)?.value ?: R.style.Theme_Alabando

        super.onCreate(savedInstanceState)

        setTheme(themeValue)

        binding = ActivityHistorialBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Inicializar ViewModel
        viewModelH = ViewModelProvider(this)[HistorialViewModel::class.java]

        // Configuración del RecyclerView
        setupRecyclerView()

        // Cargar himnos y observar cambios en el historial
        loadHimnosAndObserveHistorial()

    }


    private fun setupRecyclerView() {
        recyclerView = findViewById(R.id.recyclerView)
        adapter = HimnoAdapter(himnosList, FavoritosRoomAppDb.getInstance(applicationContext).favoritosDao())
        recyclerView.layoutManager = LinearLayoutManager(this)
        recyclerView.adapter = adapter
    }

    private fun loadHimnosAndObserveHistorial() {
        // Cargar los himnos desde el JSON
        himnosList = loadHimnosFromJson(this)

        // Observar cambios en el historial desde el ViewModel
        viewModelH.getAllHistorialOrdered().observe(this) { historialList ->
            if (!historialList.isNullOrEmpty()) {
                val sortedHimnos = getLastSortedHimnos(historialList)
                updateRecyclerView(sortedHimnos)
            } else {
                Toast.makeText(this, "No se encontraron himnos.", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun getLastSortedHimnos(historialList: List<Historial>): List<Himno> {
        // Filtrar historial eliminando elementos con id = 0 y ordenar por value en orden descendente
        val sortedHistorial = historialList
            .filter { it.uid != 0 } // Excluir elementos con id = 0
            .sortedByDescending { it.value } // Ordenar por value (descendente)

        // Obtener los IDs y asociar valores de los 3 seleccionados
        val top3Ids = sortedHistorial.map { it.uid }
        val top3Values = sortedHistorial.associateBy { it.uid }

        // Filtrar los himnos que coincidan con los IDs seleccionados
        return himnosList
            .filter { it.id in top3Ids }
            .sortedByDescending { top3Values[it.id]?.value ?: 0
            } // Ordenar según los valores de value
    }

    private fun updateRecyclerView(himnos: List<Himno>) {
        adapter.updateList(himnos)
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

}