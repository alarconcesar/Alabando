package com.pluton.himnarioeav.bdFavoritos

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import com.pluton.himnarioeav.bdPlaylists.Playlist
import com.pluton.himnarioeav.bdPlaylists.PlaylistRoomAppDb
import com.pluton.himnarioeav.dbHistorial.Historial
import com.pluton.himnarioeav.dbHistorial.HistorialRoomAppDb

class FavoritosViewModel(application: Application) : AndroidViewModel(application) {
    private val favoritosDao = FavoritosRoomAppDb.getInstance(application).favoritosDao()
    var allFavoritos : MutableLiveData<List<Favoritos>> = MutableLiveData()


    init{
        getAllFavoritos()
    }

    fun getAllFavoritosObservers(): MutableLiveData<List<Favoritos>> {
        return allFavoritos
    }

    fun getAllFavoritos() {
        val FavoritosDao = FavoritosRoomAppDb.getInstance((getApplication())).favoritosDao()
        val list = FavoritosDao?.getAll()

        allFavoritos.postValue(list!!)
    }

    fun insertFavoritos(entity: Favoritos) {
        val favoritosDao = FavoritosRoomAppDb.getInstance(getApplication()).favoritosDao()
        favoritosDao.insertOrUpdate(entity)
        getAllFavoritos()
    }

    fun getFavoritoById(id: Int): Favoritos? {
        val favoritosDao = FavoritosRoomAppDb.getInstance(getApplication()).favoritosDao()
        return favoritosDao.getFavoritoById(id)
    }

    fun getAllFavoritosOrdered(): LiveData<List<Favoritos>> {
        val favoritosDao = FavoritosRoomAppDb.getInstance(getApplication()).favoritosDao()
        return favoritosDao?.getAllFavoritosOrdered() ?: MutableLiveData(emptyList())
    }
}