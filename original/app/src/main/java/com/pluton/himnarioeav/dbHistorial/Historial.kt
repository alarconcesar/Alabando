package com.pluton.himnarioeav.dbHistorial

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "historialinfo")
data class  Historial (
    @PrimaryKey (autoGenerate = false) val uid: Int = 0,
    @ColumnInfo(name = "Value") val value: Int,
    @ColumnInfo(name = "Open") val open: Int,
    @ColumnInfo (name = "FechaAgregado") val fechaAgregado: Long // Timestamp que almacena la fecha y hora

)