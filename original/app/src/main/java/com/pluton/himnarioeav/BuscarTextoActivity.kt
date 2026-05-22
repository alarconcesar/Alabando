package com.pluton.himnarioeav

import Himno
import android.content.Context
import android.os.Bundle
import android.view.View
import android.view.inputmethod.InputMethodManager
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import android.widget.SearchView
import android.widget.Toast
import androidx.activity.viewModels
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.google.android.material.search.SearchBar
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.pluton.himnarioeav.BD.HimnoAdapterText
import com.pluton.himnarioeav.R
import com.pluton.himnarioeav.bdFavoritos.FavoritosRoomAppDb
import com.pluton.himnarioeav.dbConfiguracion.SettingsViewModel
import java.io.InputStreamReader

class BuscarTextoActivity : AppCompatActivity() {
    private lateinit var himnoAdapterText: HimnoAdapterText
    private var himnoList: List<Himno> = emptyList()
    private lateinit var searchView: SearchView
    private lateinit var recyclerView: RecyclerView

    private val viewModel: SettingsViewModel by viewModels()

    fun teclado(){
        ViewCompat.getWindowInsetsController(searchView)?.hide(WindowInsetsCompat.Type.ime())

        val imm = getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
        imm.toggleSoftInput(InputMethodManager.SHOW_IMPLICIT, 0)

        searchView.requestFocus()
    }

    override fun onCreate(savedInstanceState: Bundle?) {

        val themeValue = viewModel.getConfigById(1)?.value ?: R.style.Theme_Alabando

        super.onCreate(savedInstanceState)

        setTheme(themeValue)

        setContentView(R.layout.activity_buscar_texto)

        searchView = findViewById(R.id.searchView)
        recyclerView = findViewById(R.id.recyclerView)

        searchView.requestFocus()

        teclado()

        himnoList = loadHimnosFromJson()
        himnoAdapterText = HimnoAdapterText(himnoList, "", FavoritosRoomAppDb.getInstance(applicationContext).favoritosDao())
        recyclerView.layoutManager = LinearLayoutManager(this)
        recyclerView.adapter = himnoAdapterText

        searchView.setOnQueryTextListener(object : SearchView.OnQueryTextListener {
            override fun onQueryTextSubmit(query: String?): Boolean {
                query?.let { onSearchTextChanged(it) }
                return true
            }

            override fun onQueryTextChange(newText: String?): Boolean {
                newText?.let { onSearchTextChanged(it) }
                return true
            }
        })
    }

    private fun loadHimnosFromJson(): List<Himno> {
        return try {
            val jsonString = assets.open("himnos.json").bufferedReader().use { it.readText() }
            val listType = object : TypeToken<List<Himno>>() {}.type
            Gson().fromJson(jsonString, listType)
        } catch (e: Exception) {
            Toast.makeText(this, "Error al cargar himnos.", Toast.LENGTH_SHORT).show()
            emptyList()
        }
    }

    private fun onSearchTextChanged(searchText: String) {
        val normalizedSearchText = searchText.normalize()

        // Verificar si el texto de búsqueda está vacío
        if (normalizedSearchText.isEmpty()) {
            recyclerView.visibility = View.GONE // Ocultar el RecyclerView
        } else {
            recyclerView.visibility = View.VISIBLE // Mostrar el RecyclerView

            val filteredHimnos = himnoList.filter { himno ->
                himno.nombre.normalize().contains(normalizedSearchText) ||
                        himno.letra.normalize().contains(normalizedSearchText)
            }.sortedWith(compareBy(
                { !it.nombre.normalize().contains(normalizedSearchText) }, // Coincidencias en el nombre primero
                { it.numero.toIntOrNull() ?: Int.MAX_VALUE } // Ordenar por número de himno
            ))

            himnoAdapterText.updateList(filteredHimnos, searchText)
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


}


