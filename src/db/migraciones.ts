// Cada elemento sube user_version en 1. Nunca edite una migración ya aplicada: agregue otra.
export const MIGRACIONES: string[] = [
  `
  CREATE TABLE medicamento (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    dosis TEXT NOT NULL,
    cada_horas INTEGER NOT NULL CHECK (cada_horas BETWEEN 1 AND 48),
    primera_toma TEXT NOT NULL,
    dias INTEGER,
    foto_uri TEXT,
    activo INTEGER NOT NULL DEFAULT 1
  );
  CREATE TABLE toma (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    medicamento_id INTEGER NOT NULL REFERENCES medicamento(id) ON DELETE CASCADE,
    programada_para TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','tomada','omitida')),
    registrada_en TEXT
  );
  CREATE UNIQUE INDEX ux_toma_med_hora ON toma (medicamento_id, programada_para);
  CREATE INDEX ix_toma_programada ON toma (programada_para);
  `,
  // Fase 4 (sincronización): remote_id, updated_at, deleted, pending en cada tabla.
];
