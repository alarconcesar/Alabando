package com.pluton.himnarioeav

import android.content.Context
import android.os.Bundle
import androidx.activity.viewModels
import com.google.android.material.bottomnavigation.BottomNavigationView
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.app.AppCompatDelegate
import androidx.navigation.findNavController
import androidx.navigation.ui.AppBarConfiguration
import androidx.navigation.ui.setupWithNavController
import com.github.javiersantos.appupdater.AppUpdater
import com.github.javiersantos.appupdater.enums.Display
import com.github.javiersantos.appupdater.enums.UpdateFrom
import com.pluton.himnarioeav.bdPlaylists.Playlist
import com.pluton.himnarioeav.bdPlaylists.PlaylistViewModel
import com.pluton.himnarioeav.databinding.ActivityMainBinding
import com.pluton.himnarioeav.dbConfiguracion.Config
import com.pluton.himnarioeav.dbConfiguracion.SettingsViewModel

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding

    //BD
    private val viewModel: SettingsViewModel by viewModels()

    private val viewModelP: PlaylistViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {

        AppUpdater(this)
            .setUpdateFrom(UpdateFrom.JSON)
            .setUpdateJSON("https://raw.githubusercontent.com/RagNok16/HimnarioEAV/refs/heads/main/alabando.json")
            .setDisplay(Display.DIALOG) // Puedes elegir DIALOG, NOTIFICATION, etc.
            .start()

        //tema

        if (viewModel.getConfigById(1) == null) {
            viewModel.insertConfig(Config(1, R.style.Theme_Alabando))
        }

        if (viewModel.getConfigById(2) == null) {
            viewModel.insertConfig(Config(2, AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM))
        }

        if (viewModel.getConfigById(3) == null) {
            viewModel.insertConfig(Config(3, 18))
        }

        if (viewModel.getConfigById(4) == null) {
            viewModel.insertConfig(Config(4, 2))
        }

        //seleccionar theme

        val themeValue = viewModel.getConfigById(1)?.value ?: R.style.Theme_Alabando

        setTheme(themeValue)

        //Playlist

        viewModelP.insertPlaylist(Playlist(1, "Favoritos", "#de6a3c", 1))

        super.onCreate(savedInstanceState)

        // Verifica si es la primera vez que se ejecuta la nueva versión
        val sharedPreferences = getSharedPreferences("app_prefs", Context.MODE_PRIVATE)
        val isFirstRun = sharedPreferences.getBoolean("isFirstRun", true)

        if (isFirstRun) {
            // Borra la base de datos antigua (reemplaza "old_database_name" con el nombre correcto)
            deleteDatabase("categorias")
            deleteDatabase("userinfo")
            deleteDatabase("configinfo")

            // También puedes limpiar SharedPreferences si usabas datos almacenados
            sharedPreferences.edit().clear().apply()

            // Marca que la app ya no está en su primera ejecución
            sharedPreferences.edit().putBoolean("isFirstRun", false).apply()
        }

        // Obtén el valor de la base de datos o usa el valor predeterminado
        val darkValue =
            viewModel.getConfigById(2)?.value ?: AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM

        // Aplica el tema seleccionado
        AppCompatDelegate.setDefaultNightMode(darkValue)

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val navView: BottomNavigationView = binding.navView

        val navController = findNavController(R.id.nav_host_fragment_activity_main)

        // Configurar el gráfico de navegación dinámicamente solo si es la primera vez
        if (savedInstanceState == null) {
            // Obtener el valor inicial desde la base de datos o establecer un predeterminado
            val startValue = viewModel.getConfigById(4)?.value ?: 2

            // Determinar el destino inicial basado en el valor
            val startDestination = when (startValue) {
                1 -> R.id.navigation_inicio
                2 -> R.id.navigation_buscar
                else -> R.id.navigation_buscar // Predeterminado si no coincide
            }

            // Configurar el gráfico de navegación dinámicamente
            val navGraph = navController.navInflater.inflate(R.navigation.mobile_navigation).apply {
                setStartDestination(startDestination)
            }
            navController.graph = navGraph
        }

        // Configurar el BottomNavigationView
        val appBarConfiguration = AppBarConfiguration(
            setOf(
                R.id.navigation_inicio,
                R.id.navigation_buscar,
                R.id.navigation_albumes,
                R.id.navigation_favoritos
            )
        )
        navView.setupWithNavController(navController)
    }
}