import { getDb } from '@/db';
import type { EstadoToma, Toma, TomaConMedicamento } from '@/domain/tipos';

const BASE = `SELECT t.*, m.nombre, m.dosis FROM toma t JOIN medicamento m ON m.id = t.medicamento_id`;

export async function insertarTomaSiNoExiste(medicamentoId: number, iso: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR IGNORE INTO toma
      (medicamento_id, programada_para, updated_at, pendiente_sync)
     VALUES (?, ?, ?, 0)`,
    [medicamentoId, iso, new Date().toISOString()],
  );
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
  await db.runAsync(
    `UPDATE toma
     SET estado = ?, registrada_en = ?, updated_at = ?, pendiente_sync = 1
     WHERE id = ?`,
    [estado, registradaEn, new Date().toISOString(), id],
  );
}

export async function establecerRemoteId(id: number, remoteId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE toma SET remote_id = ?, pendiente_sync = 1, updated_at = ? WHERE id = ?',
    [remoteId, new Date().toISOString(), id],
  );
}

export async function marcarSincronizado(id: number, updatedAt: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE toma SET pendiente_sync = 0, updated_at = ? WHERE id = ?', [
    updatedAt,
    id,
  ]);
}

export async function obtenerPorRemoteId(remoteId: string): Promise<Toma | null> {
  const db = await getDb();
  return db.getFirstAsync<Toma>('SELECT * FROM toma WHERE remote_id = ?', [remoteId]);
}

export async function listarPendientes(): Promise<Toma[]> {
  const db = await getDb();
  return db.getAllAsync<Toma>('SELECT * FROM toma WHERE pendiente_sync = 1 OR remote_id IS NULL');
}

export async function aplicarRemoto(datos: {
  id: string;
  medicamento_id: string;
  programada_para: string;
  estado: EstadoToma;
  registrada_en: string | null;
  deleted_at: string | null;
  updated_at: string;
}): Promise<void> {
  const db = await getDb();
  const medicamento = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM medicamento WHERE remote_id = ?',
    [datos.medicamento_id],
  );
  if (!medicamento) return;
  const existente = await obtenerPorRemoteId(datos.id);
  if (existente) {
    await db.runAsync(
      `UPDATE toma SET medicamento_id = ?, programada_para = ?, estado = ?, registrada_en = ?,
       eliminado = ?, updated_at = ?, pendiente_sync = 0
       WHERE remote_id = ?`,
      [
        medicamento.id,
        datos.programada_para,
        datos.estado,
        datos.registrada_en,
        datos.deleted_at ? 1 : 0,
        datos.updated_at,
        datos.id,
      ],
    );
    return;
  }
  await db.runAsync(
    `INSERT INTO toma
      (remote_id, medicamento_id, programada_para, estado, registrada_en, eliminado, updated_at, pendiente_sync)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      datos.id,
      medicamento.id,
      datos.programada_para,
      datos.estado,
      datos.registrada_en,
      datos.deleted_at ? 1 : 0,
      datos.updated_at,
    ],
  );
}
