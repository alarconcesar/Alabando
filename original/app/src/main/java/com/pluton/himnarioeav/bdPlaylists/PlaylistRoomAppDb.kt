package com.pluton.himnarioeav.bdPlaylists

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase

@Database(entities = [Playlist::class], version = 1)
abstract class PlaylistRoomAppDb: RoomDatabase() {

    abstract fun PlaylistDao(): PlaylistDao

    companion object {
        private var INSTANCE: PlaylistRoomAppDb?= null

        val Playlist_1_2: Migration = object: Migration(1, 2) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL("ALTER TABLE playlistbd ADD COLUMN phone TEXT DEFAULT ''")
            }
        }

        fun getAppDatabase(context: Context): PlaylistRoomAppDb? {

            if(INSTANCE == null ) {

                INSTANCE = Room.databaseBuilder<PlaylistRoomAppDb>(
                    context.applicationContext, PlaylistRoomAppDb::class.java, "PlaylistAppDBB"
                )
                    .addMigrations(Playlist_1_2)
                    .allowMainThreadQueries()
                    .build()

            }
            return INSTANCE
        }

        fun destroyInstance() {
            INSTANCE = null
        }
    }
}
