package com.pluton.himnarioeav.ui.buscar

import Himno
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.ViewModelProvider
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.search.SearchBar
import com.google.gson.Gson
import com.pluton.himnarioeav.R
import com.pluton.himnarioeav.databinding.FragmentBuscarBinding
import com.google.firebase.crashlytics.buildtools.reloc.com.google.common.reflect.TypeToken
import com.pluton.himnarioeav.BD.HimnoAdapter
import com.pluton.himnarioeav.BD.HimnoAdapterText
import com.pluton.himnarioeav.BuscarTextoActivity
import com.pluton.himnarioeav.HistorialActivity
import com.pluton.himnarioeav.bdFavoritos.FavoritosRoomAppDb
import java.io.IOException

class BuscarFragment : Fragment() {
    private lateinit var messageTextView: TextView
    private var _binding: FragmentBuscarBinding? = null
    private lateinit var adapter: HimnoAdapter
    private var himnosList: List<Himno> = emptyList()
    private var filteredList: List<Himno> = emptyList()

    private var resetSearchFlag = false

    // Variables para manejar el estado
    private var text1 = ""
    private var text2 = ""

    private val binding get() = _binding!!

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val buscarViewModel =
            ViewModelProvider(this).get(BuscarViewModel::class.java)

        _binding = FragmentBuscarBinding.inflate(inflater, container, false)

        binding.btnText.setOnClickListener {
            val intent = Intent(requireContext(), BuscarTextoActivity::class.java)
            startActivity(intent)
        }


        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Restaurar el estado si existe
        text1 = savedInstanceState?.getString("TEXT1", "") ?: ""
        text2 = savedInstanceState?.getString("TEXT2", "") ?: ""

        // Inicializar views
        messageTextView = view.findViewById(R.id.messageTextView)
        messageTextView.text = text1 + text2

        // Configurar botones
        setupButtons(view)

        // Inicializar RecyclerView
        val recyclerView = view.findViewById<RecyclerView>(R.id.recyclerView)
        recyclerView.layoutManager = LinearLayoutManager(requireContext())

        himnosList = loadHimnosFromJson(requireContext())
        filteredList = himnosList.toMutableList()

        adapter = HimnoAdapter(himnosList, FavoritosRoomAppDb.getInstance(requireContext()).favoritosDao()) // Usar requireContext()
        recyclerView.adapter = adapter

        // Aplicar filtro inicial
        filter(messageTextView.text.toString())

    }

    private fun setupButtons(view: View) {
        val buttonIds = listOf(
            R.id.key1, R.id.key2, R.id.key3, R.id.key4, R.id.key5,
            R.id.key6, R.id.key7, R.id.key8, R.id.key9, R.id.key0,
            R.id.keyC, R.id.keyS, R.id.keyN, R.id.keyX
        )

        buttonIds.forEach { id ->
            view.findViewById<Button>(id).setOnClickListener { button ->
                val key = (button as Button).text.toString()
                handleKeyPress(key)
            }
        }
    }

    private fun filter(query: String) {
        if (query.isEmpty()) {
            // Si el filtro está vacío, no mostrar nada
            filteredList = emptyList()
            view?.findViewById<RecyclerView>(R.id.recyclerView)?.visibility = View.INVISIBLE
        } else {
            // Filtrar los himnos y mantener solo el primero
            filteredList = himnosList.filter { it.numero.contains(query, ignoreCase = true) }
                .take(1) // Solo mantener el primer resultado

            // Controlar la visibilidad del RecyclerView
            view?.findViewById<RecyclerView>(R.id.recyclerView)?.visibility =
                if (filteredList.isEmpty()) View.INVISIBLE else View.VISIBLE
        }
        adapter.updateList(filteredList)
    }

    private fun loadHimnosFromJson(context: Context): List<Himno> {
        val jsonString: String
        try {
            jsonString = context.assets.open("himnos.json").bufferedReader().use { it.readText() }
        } catch (ioException: IOException) {
            ioException.printStackTrace()
            return emptyList()
        }
        val listType = object : TypeToken<List<Himno>>() {}.type
        return Gson().fromJson(jsonString, listType)
    }

    private fun handleKeyPress(key: String) {
        if (key.all { it.isDigit() }) {
            text2 += key
            text2 = text2.take(3)
        } else {
            if (key == "$") {
                val currentValue = messageTextView.text.toString()
                if (currentValue.isNotEmpty()) {
                    when (messageTextView.text) {
                        "C-", "S-", "N-" -> {
                            "".also { messageTextView.text = it }
                            text1 = ""
                        }
                        else -> {
                            messageTextView.text = currentValue.dropLast(1)
                            text2 = text2.dropLast(1)
                        }
                    }
                }
            } else {
                text1 = if (text1 == "$key-") "" else "$key-"
            }
        }
        messageTextView.text = text1 + text2
        filter(messageTextView.text.toString())
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        outState.putString("TEXT1", text1)
        outState.putString("TEXT2", text2)
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    override fun onResume() {
        super.onResume()
        resetSearch()
        // Si el indicador está activado, reiniciar búsqueda
        if (resetSearchFlag) {
            resetSearch()
            resetSearchFlag = false
        }
    }

    private fun resetSearch() {
        // Vaciar los textos y actualizar el filtro
        text1 = ""
        text2 = ""
        messageTextView.text = ""
        filteredList = emptyList()
        adapter.updateList(filteredList)

        // Ocultar el RecyclerView
        view?.findViewById<RecyclerView>(R.id.recyclerView)?.visibility = View.INVISIBLE
    }
}
