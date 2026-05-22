package com.pluton.himnarioeav.dbConfiguracion

import androidx.lifecycle.LiveData
import androidx.room.*

@Dao
interface ConfigDao {

    @Insert( onConflict = OnConflictStrategy. ABORT)
    fun insertConfig(user: Config) :Long

    @Insert( onConflict = OnConflictStrategy. ABORT)
     fun insertConfigList(people:List<Config>):List<Long>

    @Update
     fun updateConfig(user:Config): Int

    @Delete
     fun deleteConfig(user:Config):Int

    @Query("SELECT * FROM configinfo")
    fun getAll():List<Config>

    @Query("SELECT * FROM configinfo WHERE uid IN (:userIds)")
     fun getAllById(userIds: IntArray) :List<Config>

    @Query("SELECT * FROM configinfo WHERE uid = :id LIMIT 1")
    fun getConfigById(id: Int): Config?

}