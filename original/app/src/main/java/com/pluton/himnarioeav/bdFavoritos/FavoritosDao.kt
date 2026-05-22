package com.pluton.himnarioeav.bdFavoritos

import androidx.lifecycle.LiveData
import androidx.room.*
import com.pluton.himnarioeav.bdFavoritos.Favoritos
import com.pluton.himnarioeav.dbHistorial.Historial

@Dao
interface FavoritosDao {

    @Query("SELECT * FROM favoritosbd")
    fun getAll():List<Favoritos>

    @Query("SELECT * FROM favoritosbd WHERE fid = :id LIMIT 1")
    fun getFavoritoById(id: Int): Favoritos?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    fun insertOrUpdate(favorito: Favoritos)

    @Query("SELECT * FROM favoritosbd ORDER BY fid ASC")
    fun getAllFavoritosOrdered(): LiveData<List<Favoritos>>
}