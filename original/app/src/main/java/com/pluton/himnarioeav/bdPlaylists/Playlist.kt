package com.pluton.himnarioeav.bdPlaylists

import android.graphics.Color
import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "playlistbd")
data class  Playlist (
    @PrimaryKey (autoGenerate = true) val pid: Int = 0,
    @ColumnInfo(name = "Name") val name: String,
    @ColumnInfo(name = "Color") val color: String,
    @ColumnInfo(name = "Block") val block: Int,
)