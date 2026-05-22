package com.pluton.himnarioeav.dbConfiguracion

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase

@Database(entities = [Config::class], version = 1)
abstract class ConfigRoomAppDb: RoomDatabase() {

    abstract fun configDao(): ConfigDao

    companion object {
        private var INSTANCE: ConfigRoomAppDb?= null

        val Configmigration_1_2: Migration = object: Migration(1, 2) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL("ALTER TABLE configinfo ADD COLUMN phone TEXT DEFAULT ''")
            }
        }

        fun getAppDatabase(context: Context): ConfigRoomAppDb? {

            if(INSTANCE == null ) {

                INSTANCE = Room.databaseBuilder<ConfigRoomAppDb>(
                    context.applicationContext, ConfigRoomAppDb::class.java, "CanfigAppDBB"
                )
                    .addMigrations(Configmigration_1_2)
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