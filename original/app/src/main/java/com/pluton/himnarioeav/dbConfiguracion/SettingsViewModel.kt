package com.pluton.himnarioeav.dbConfiguracion

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.MutableLiveData

class SettingsViewModel (app: Application): AndroidViewModel(app) {
    var allConfig : MutableLiveData<List<Config>> = MutableLiveData()

    init{
        getAllConfig()
    }

    fun getAllConfigObservers(): MutableLiveData<List<Config>> {
        return allConfig
    }

    fun getAllConfig() {
        val ConfigDao = ConfigRoomAppDb.getAppDatabase((getApplication()))?.configDao()
        val list = ConfigDao?.getAll()

        allConfig.postValue(list!!)
    }

    fun getConfigById(id: Int): Config? {
        val configDao = ConfigRoomAppDb.getAppDatabase(getApplication())?.configDao()
        return configDao?.getConfigById(id) // Devuelve el objeto Config o null si no existe
    }

    fun insertConfig(entity: Config) {
        val ConfigDao = ConfigRoomAppDb.getAppDatabase(getApplication())?.configDao()
        ConfigDao?.insertConfig(entity)
        getAllConfig()
    }

    fun updateConfigInfo(entity: Config){
        val ConfigDao = ConfigRoomAppDb.getAppDatabase(getApplication())?.configDao()
        ConfigDao?.updateConfig(entity)
        getAllConfig()
    }
}