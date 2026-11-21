import { getDb } from '@/db';
import type { Medicamento } from '@/domain/tipos';
import type { ValorMedicamento } from '@/domain/validacion';

export async function listarMedicamentos(): Promise<Medicamento[]> {
  const db = await getDb();
  return db.getAllAsync<Medicamento>(
    'SELECT * FROM medicamento WHERE activo = 1 ORDER BY nombre COLLATE NOCASE',
  );
}

export async function obtenerMedicamento(id: number): Promise<Medicamento | null> {
  const db = await getDb();
  return db.getFirstAsync<Medicamento>('SELECT * FROM medicamento WHERE id = ?', [id]);
}

export async function buscarMedicamentos(texto: string): Promise<Medicamento[]> {
  const db = await getDb();
  return db.getAllAsync<Medicamento>(
    'SELECT * FROM medicamento WHERE activo = 1 AND nombre LIKE ? ORDER BY nombre COLLATE NOCASE',
    [`%${texto}%`],
  );
}

export async function crearMedicamento(v: ValorMedicamento): Promise<number> {
  const db = await getDb();
  const r = await db.runAsync(
    'INSERT INTO medicamento (nombre, dosis, cada_horas, primera_toma, dias) VALUES (?, ?, ?, ?, ?)',
    [v.nombre, v.dosis, v.cada_horas, v.primera_toma, v.dias],
  );
  return r.lastInsertRowId;
}

export async function actualizarMedicamento(id: number, v: ValorMedicamento): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE medicamento SET nombre = ?, dosis = ?, cada_horas = ?, primera_toma = ?, dias = ? WHERE id = ?',
    [v.nombre, v.dosis, v.cada_horas, v.primera_toma, v.dias, id],
  );
}

export async function eliminarMedicamento(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM medicamento WHERE id = ?', [id]);
}
