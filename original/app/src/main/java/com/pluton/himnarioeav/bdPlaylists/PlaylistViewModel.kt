package com.pluton.himnarioeav.bdPlaylists

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.MutableLiveData

class PlaylistViewModel (app: Application): AndroidViewModel(app) {
    var allPlaylist: MutableLiveData<List<Playlist>> = MutableLiveData()

    init {
        getAllPlaylist()
    }

    fun getAllPlaylistObservers(): MutableLiveData<List<Playlist>> {
        return allPlaylist
    }

    fun getAllPlaylist() {
        val playlistDao = PlaylistRoomAppDb.getAppDatabase((getApplication()))?.PlaylistDao()
        val list = playlistDao?.getAll()

        allPlaylist.postValue(list!!)
    }

    fun getPlaylistById(id: Int): Playlist? {
        val playlistDao = PlaylistRoomAppDb.getAppDatabase(getApplication())?.PlaylistDao()
        return playlistDao?.getPlaylistById(id) // Devuelve el objeto Playlist o null si no existe
    }

    fun insertPlaylist(entity: Playlist) {
        val playlistDao = PlaylistRoomAppDb.getAppDatabase(getApplication())?.PlaylistDao()
        playlistDao?.insertPlaylist(entity)
        getAllPlaylist()
    }

    fun updatePlaylistInfo(entity: Playlist) {
        val playlistDao = PlaylistRoomAppDb.getAppDatabase(getApplication())?.PlaylistDao()
        playlistDao?.updatePlaylist(entity)
        getAllPlaylist()
    }
}