package com.pluton.himnarioeav.dbHistorial

import androidx.lifecycle.LiveData
import androidx.room.*
import com.pluton.himnarioeav.dbConfiguracion.Config
import com.pluton.himnarioeav.dbHistorial.Historial

@Dao
interface HistorialDao {

    @Insert( onConflict = OnConflictStrategy.REPLACE)
    fun insertHistorial(user: Historial) :Long

    @Update
    fun updateHistorial(user: Historial): Int

    @Query("SELECT * FROM Historialinfo")
    fun getAll():List<Historial>

    @Query("SELECT * FROM Historialinfo WHERE uid IN (:userIds)")
     fun getAllById(userIds: IntArray) :List<Historial>

    @Query("SELECT * FROM Historialinfo WHERE uid = :id LIMIT 1")
    fun getHistorialById(id: Int): Historial?

    @Query("SELECT COUNT(*) FROM Historialinfo")
    fun getHistorialCount(): Int

    @Query("SELECT * FROM Historialinfo ORDER BY uid ASC")
    fun getAllHistorialOrdered(): LiveData<List<Historial>>


}