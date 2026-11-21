import { getDb } from '@/db';
import type { EstadoToma, Toma, TomaConMedicamento } from '@/domain/tipos';

const BASE = `SELECT t.*, m.nombre, m.dosis FROM toma t JOIN medicamento m ON m.id = t.medicamento_id`;

export async function insertarTomaSiNoExiste(medicamentoId: number, iso: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('INSERT OR IGNORE INTO toma (medicamento_id, programada_para) VALUES (?, ?)', [
    medicamentoId,
    iso,
  ]);
}

/** Borra las tomas pendientes desde `desdeIso` (al editar la frecuencia). */
export async function borrarPendientesDesde(
  medicamentoId: number,
  desdeIso: string,
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `DELETE FROM toma WHERE medicamento_id = ? AND estado = 'pendiente' AND programada_para >= ?`,
    [medicamentoId, desdeIso],
  );
}

export async function listarEnRango(
  desdeIso: string,
  hastaIso: string,
): Promise<TomaConMedicamento[]> {
  const db = await getDb();
  return db.getAllAsync<TomaConMedicamento>(
    `${BASE} WHERE m.activo = 1 AND t.programada_para >= ? AND t.programada_para < ? ORDER BY t.programada_para`,
    [desdeIso, hastaIso],
  );
}

export async function listarHistorial(limite = 200): Promise<TomaConMedicamento[]> {
  const db = await getDb();
  return db.getAllAsync<TomaConMedicamento>(
    `${BASE} WHERE t.estado IN ('tomada','omitida') ORDER BY t.programada_para DESC LIMIT ?`,
    [limite],
  );
}

export async function listarDesde(desdeIso: string): Promise<Toma[]> {
  const db = await getDb();
  return db.getAllAsync<Toma>('SELECT * FROM toma WHERE programada_para >= ?', [desdeIso]);
}

export async function marcar(id: number, estado: EstadoToma, registradaEn: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE toma SET estado = ?, registrada_en = ? WHERE id = ?', [
    estado,
    registradaEn,
    id,
  ]);
}
