import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase;

export function getDB() {
  if (!db) {
    db = SQLite.openDatabaseSync("melanoscan.db");
  }
  return db;
}