package com.pluton.himnarioeav.dbHistorial

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import com.pluton.himnarioeav.dbConfiguracion.Config
import com.pluton.himnarioeav.dbConfiguracion.ConfigRoomAppDb
import com.pluton.himnarioeav.dbHistorial.Historial
import com.pluton.himnarioeav.dbHistorial.HistorialRoomAppDb

class HistorialViewModel (app: Application): AndroidViewModel(app) {
    var allHistorial : MutableLiveData<List<Historial>> = MutableLiveData()

    init{
        getAllHistorial()
    }

    fun getAllHistorialObservers(): MutableLiveData<List<Historial>> {
        return allHistorial
    }

    fun getAllHistorial() {
        val HistorialDao = HistorialRoomAppDb.getAppDatabase((getApplication()))?.historialDao()
        val list = HistorialDao?.getAll()

        allHistorial.postValue(list!!)
    }

    fun getHistorialById(uid: Int): Historial? {
        val HistorialDao = HistorialRoomAppDb.getAppDatabase(getApplication())?.historialDao()
        return HistorialDao?.getHistorialById(uid) // Devuelve el objeto Historial o null si no existe
    }

    fun insertHistorial(entity: Historial) {
        val HistorialDao = HistorialRoomAppDb.getAppDatabase(getApplication())?.historialDao()
        HistorialDao?.insertHistorial(entity)
        getAllHistorial()
    }

    fun updateHistorial(entity: Historial){
        val HistorialDao = HistorialRoomAppDb.getAppDatabase(getApplication())?.historialDao()
        HistorialDao?.updateHistorial(entity)
        getAllHistorial()
    }

    fun getHistorialCount(): Int {
        val dao = HistorialRoomAppDb.getAppDatabase(getApplication())?.historialDao()
        return dao?.getHistorialCount() ?: 0
    }

    fun getAllHistorialOrdered(): LiveData<List<Historial>> {
        val dao = HistorialRoomAppDb.getAppDatabase(getApplication())?.historialDao()
        return dao?.getAllHistorialOrdered() ?: MutableLiveData(emptyList())
    }

}