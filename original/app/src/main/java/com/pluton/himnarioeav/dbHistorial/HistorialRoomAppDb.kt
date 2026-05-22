package com.pluton.himnarioeav.dbHistorial

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase
import com.pluton.himnarioeav.dbHistorial.Historial
import com.pluton.himnarioeav.dbHistorial.HistorialDao

@Database(entities = [Historial::class], version = 1)
abstract class HistorialRoomAppDb: RoomDatabase() {

    abstract fun historialDao(): HistorialDao

    companion object {
        private var INSTANCE: HistorialRoomAppDb?= null

        val Historialmigration_1_2: Migration = object: Migration(1, 2) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL("ALTER TABLE historialinfo ADD COLUMN phone TEXT DEFAULT ''")
            }
        }

        fun getAppDatabase(context: Context): HistorialRoomAppDb? {

            if(INSTANCE == null ) {

                INSTANCE = Room.databaseBuilder<HistorialRoomAppDb>(
                    context.applicationContext, HistorialRoomAppDb::class.java, "HistorialAppDBB"
                )
                    .addMigrations(Historialmigration_1_2)
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