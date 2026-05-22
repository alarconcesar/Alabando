package com.pluton.himnarioeav

import Himno
import android.content.Context
import android.os.Bundle
import android.view.View
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
import com.pluton.himnarioeav.bdFavoritos.FavoritosRoomAppDb
import com.pluton.himnarioeav.databinding.ActivityNuevosBinding
import com.pluton.himnarioeav.dbConfiguracion.SettingsViewModel

class NuevosActivity : AppCompatActivity() {

    private lateinit var recyclerView: RecyclerView
    private lateinit var adapter: HimnoAdapter
    private var himnosList: List<Himno> = emptyList()

    private val viewModel: SettingsViewModel by viewModels()

    private lateinit var binding: ActivityNuevosBinding

    override fun onCreate(savedInstanceState: Bundle?) {

        val themeValue = viewModel.getConfigById(1)?.value ?: R.style.Theme_Alabando

        super.onCreate(savedInstanceState)

        setTheme(themeValue)

        binding = ActivityNuevosBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Configuración del RecyclerView
        setupRecyclerView()

        // Cargar himnos y observar cambios en el historial
        loadHimnosAndObserveNuevos()

    }


    private fun setupRecyclerView() {
        recyclerView = findViewById(R.id.recyclerView)
        adapter = HimnoAdapter(himnosList, FavoritosRoomAppDb.getInstance(applicationContext).favoritosDao())
        recyclerView.layoutManager = LinearLayoutManager(this)
        recyclerView.adapter = adapter
    }

    private fun loadHimnosAndObserveNuevos() {
        // Cargar los himnos desde el JSON
        himnosList = loadHimnosFromJson(this)

        val himnofiltrado = himnosList.filter { it.nuevo == 1 }

        adapter.updateList(himnofiltrado)

        if (himnofiltrado.size == 0) {
            binding.recyclerView.visibility = View.GONE
            binding.vacio.visibility = View.VISIBLE
        }else{
            binding.recyclerView.visibility = View.VISIBLE
            binding.vacio.visibility = View.GONE
        }

        // Actualizar la cantidad de himnos en el TextView
        binding.cantidad.text = "${himnofiltrado.size} himnos"
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