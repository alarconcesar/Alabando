package com.pluton.himnarioeav.ui.albumes

import Himno
import android.os.Bundle
import androidx.activity.viewModels
import com.google.android.material.snackbar.Snackbar
import androidx.appcompat.app.AppCompatActivity
import androidx.navigation.findNavController
import androidx.navigation.ui.AppBarConfiguration
import androidx.navigation.ui.navigateUp
import androidx.navigation.ui.setupActionBarWithNavController
import androidx.recyclerview.widget.LinearLayoutManager
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.pluton.himnarioeav.BD.HimnoAdapter
import com.pluton.himnarioeav.R
import com.pluton.himnarioeav.bdFavoritos.FavoritosRoomAppDb
import com.pluton.himnarioeav.databinding.ActivityListaHimnosBinding
import com.pluton.himnarioeav.dbConfiguracion.SettingsViewModel

class ListaHimnosActivity : AppCompatActivity() {

    private lateinit var binding: ActivityListaHimnosBinding
    private lateinit var adapter: HimnoAdapter
    private lateinit var himnosFiltrados: List<Himno>

    private val viewModel: SettingsViewModel by viewModels()


    override fun onCreate(savedInstanceState: Bundle?) {

        val themeValue = viewModel.getConfigById(1)?.value ?: R.style.Theme_Alabando

        setTheme(themeValue)

        super.onCreate(savedInstanceState)
        binding = ActivityListaHimnosBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val categoriaNombre = intent.getStringExtra("categoriaNombre")

        // Cargar himnos desde JSON
        val himnos = cargarHimnosDesdeJson()

        // Filtrar himnos por categoría
        himnosFiltrados = himnos.filter { it.categoria == categoriaNombre }

        // Configurar RecyclerView
        binding.recyclerViewHimnos.layoutManager = LinearLayoutManager(this)
        adapter = HimnoAdapter(himnosFiltrados, FavoritosRoomAppDb.getInstance(applicationContext).favoritosDao())
        binding.recyclerViewHimnos.adapter = adapter

        // Mostrar la cantidad y el nombre de la categoría
        binding.categoriaNombre.text = categoriaNombre
        binding.categoriaCantidad.text = "${himnosFiltrados.size} himnos"
    }

    private fun cargarHimnosDesdeJson(): List<Himno> {
        val inputStream = assets.open("himnos.json")
        val json = inputStream.bufferedReader().use { it.readText() }

        // Convertir JSON a lista de himnos
        val gson = Gson()
        val himnoType = object : TypeToken<List<Himno>>() {}.type
        return gson.fromJson(json, himnoType)
    }
}
