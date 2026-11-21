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
    `INSERT INTO medicamento
      (nombre, dosis, cada_horas, primera_toma, dias, foto_uri, updated_at, pendiente_sync)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
    [v.nombre, v.dosis, v.cada_horas, v.primera_toma, v.dias, v.foto_uri, new Date().toISOString()],
  );
  return r.lastInsertRowId;
}

export async function actualizarMedicamento(id: number, v: ValorMedicamento): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE medicamento
     SET nombre = ?, dosis = ?, cada_horas = ?, primera_toma = ?, dias = ?, foto_uri = ?,
         updated_at = ?, pendiente_sync = 1
     WHERE id = ?`,
    [
      v.nombre,
      v.dosis,
      v.cada_horas,
      v.primera_toma,
      v.dias,
      v.foto_uri,
      new Date().toISOString(),
      id,
    ],
  );
}

export async function eliminarMedicamento(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE medicamento
     SET activo = 0, eliminado = 1, updated_at = ?, pendiente_sync = 1
     WHERE id = ?`,
    [new Date().toISOString(), id],
  );
}

export async function establecerRemoteId(id: number, remoteId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE medicamento SET remote_id = ?, pendiente_sync = 1, updated_at = ? WHERE id = ?',
    [remoteId, new Date().toISOString(), id],
  );
}

export async function marcarSincronizado(id: number, updatedAt: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE medicamento SET pendiente_sync = 0, updated_at = ? WHERE id = ?', [
    updatedAt,
    id,
  ]);
}

export async function obtenerPorRemoteId(remoteId: string): Promise<Medicamento | null> {
  const db = await getDb();
  return db.getFirstAsync<Medicamento>('SELECT * FROM medicamento WHERE remote_id = ?', [remoteId]);
}

export async function listarPendientes(): Promise<Medicamento[]> {
  const db = await getDb();
  return db.getAllAsync<Medicamento>(
    'SELECT * FROM medicamento WHERE pendiente_sync = 1 OR remote_id IS NULL',
  );
}

export async function aplicarRemoto(datos: {
  id: string;
  nombre: string;
  dosis: string;
  cada_horas: number;
  primera_toma: string;
  dias: number | null;
  activo: boolean;
  foto_url: string | null;
  deleted_at: string | null;
  updated_at: string;
}): Promise<void> {
  const db = await getDb();
  const existente = await obtenerPorRemoteId(datos.id);
  if (existente) {
    await db.runAsync(
      `UPDATE medicamento SET nombre = ?, dosis = ?, cada_horas = ?, primera_toma = ?,
       dias = ?, activo = ?, eliminado = ?, foto_uri = COALESCE(foto_uri, ?),
       updated_at = ?, pendiente_sync = 0
       WHERE remote_id = ?`,
      [
        datos.nombre,
        datos.dosis,
        datos.cada_horas,
        datos.primera_toma,
        datos.dias,
        datos.deleted_at ? 0 : datos.activo ? 1 : 0,
        datos.deleted_at ? 1 : 0,
        datos.foto_url,
        datos.updated_at,
        datos.id,
      ],
    );
    return;
  }
  await db.runAsync(
    `INSERT INTO medicamento
      (remote_id, nombre, dosis, cada_horas, primera_toma, dias, foto_uri, activo,
       eliminado, updated_at, pendiente_sync)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      datos.id,
      datos.nombre,
      datos.dosis,
      datos.cada_horas,
      datos.primera_toma,
      datos.dias,
      datos.foto_url,
      datos.deleted_at ? 0 : datos.activo ? 1 : 0,
      datos.deleted_at ? 1 : 0,
      datos.updated_at,
    ],
  );
}
