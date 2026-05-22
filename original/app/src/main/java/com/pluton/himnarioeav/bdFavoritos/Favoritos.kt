package com.pluton.himnarioeav.bdFavoritos

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "favoritosbd")
data class  Favoritos (
    @PrimaryKey(autoGenerate = true) val fid: Int = 0,
    @ColumnInfo(name = "Value") val value: Int,
    @ColumnInfo (name = "FechaAgregado") val fechaAgregado: Long // Timestamp que almacena la fecha y hora

)