import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase;

export function getDB() {
  if (!db) {
    db = SQLite.openDatabaseSync("melanoscanApp.db");
  }
  return db;
}