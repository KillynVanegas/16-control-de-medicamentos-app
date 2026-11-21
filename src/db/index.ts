import * as SQLite from 'expo-sqlite';
import { MIGRACIONES } from './migraciones';

let promesa: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!promesa) promesa = abrir();
  return promesa;
}

async function abrir() {
  const db = await SQLite.openDatabaseAsync('medicamentos.db');
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  await migrar(db);
  return db;
}

export async function migrar(db: SQLite.SQLiteDatabase) {
  const fila = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const actual = fila?.user_version ?? 0;
  for (let i = actual; i < MIGRACIONES.length; i++) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRACIONES[i] as string);
      await db.execAsync(`PRAGMA user_version = ${i + 1}`);
    });
  }
}
