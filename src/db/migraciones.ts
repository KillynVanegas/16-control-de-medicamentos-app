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
  `
  ALTER TABLE medicamento ADD COLUMN remote_id TEXT;
  ALTER TABLE medicamento ADD COLUMN updated_at TEXT;
  ALTER TABLE medicamento ADD COLUMN eliminado INTEGER NOT NULL DEFAULT 0;
  ALTER TABLE medicamento ADD COLUMN pendiente_sync INTEGER NOT NULL DEFAULT 1;
  ALTER TABLE toma ADD COLUMN remote_id TEXT;
  ALTER TABLE toma ADD COLUMN updated_at TEXT;
  ALTER TABLE toma ADD COLUMN eliminado INTEGER NOT NULL DEFAULT 0;
  ALTER TABLE toma ADD COLUMN pendiente_sync INTEGER NOT NULL DEFAULT 1;
  CREATE UNIQUE INDEX ux_medicamento_remote ON medicamento(remote_id);
  CREATE UNIQUE INDEX ux_toma_remote ON toma(remote_id);
  `,
];
