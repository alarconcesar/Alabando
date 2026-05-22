package com.pluton.himnarioeav.bdFavoritos

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase

@Database(entities = [Favoritos::class], version = 1)
abstract class FavoritosRoomAppDb : RoomDatabase() {

    abstract fun favoritosDao(): FavoritosDao

    companion object {
        @Volatile
        private var INSTANCE: FavoritosRoomAppDb? = null

        val favoritosmigration_1_2: Migration = object : Migration(1, 2) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL("ALTER TABLE favoritosbd ADD COLUMN phone TEXT DEFAULT ''")
            }
        }

        fun getInstance(context: Context): FavoritosRoomAppDb {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    FavoritosRoomAppDb::class.java,
                    "FavoritosAppDBB"
                )
                    .addMigrations(favoritosmigration_1_2)
                    .allowMainThreadQueries()
                    .build()
                INSTANCE = instance
                instance
            }
        }

        fun destroyInstance() {
            INSTANCE = null
        }
    }
}
