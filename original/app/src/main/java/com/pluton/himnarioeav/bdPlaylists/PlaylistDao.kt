package com.pluton.himnarioeav.bdPlaylists

import androidx.room.*
@Dao
interface PlaylistDao {

    @Insert( onConflict = OnConflictStrategy.IGNORE)
    fun insertPlaylist(user: Playlist) :Long

    @Update
    fun updatePlaylist(user: Playlist): Int

    @Delete
    fun deletePlaylist(user: Playlist):Int

    @Query("SELECT * FROM playlistbd")
    fun getAll():List<Playlist>

    @Query("SELECT * FROM playlistbd WHERE pid IN (:userIds)")
    fun getAllById(userIds: IntArray) :List<Playlist>

    @Query("SELECT * FROM playlistbd WHERE pid = :id LIMIT 1")
    fun getPlaylistById(id: Int): Playlist?

}