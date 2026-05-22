package com.pluton.himnarioeav.dbConfiguracion

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "configinfo")
data class  Config (
    @PrimaryKey (autoGenerate = true) val uid: Int = 0,
    @ColumnInfo(name = "Value") val value: Int
)