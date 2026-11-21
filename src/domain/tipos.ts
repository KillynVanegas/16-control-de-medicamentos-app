export type EstadoToma = 'pendiente' | 'tomada' | 'omitida';

export interface Medicamento {
  id: number;
  nombre: string;
  dosis: string;
  cada_horas: number;
  primera_toma: string;
  dias: number | null;
  foto_uri: string | null;
  activo: number;
  remote_id?: string | null;
  updated_at?: string | null;
  eliminado?: number;
  pendiente_sync?: number;
}

export interface Toma {
  id: number;
  medicamento_id: number;
  programada_para: string;
  estado: EstadoToma;
  registrada_en: string | null;
  remote_id?: string | null;
  updated_at?: string | null;
  eliminado?: number;
  pendiente_sync?: number;
}

export interface TomaConMedicamento extends Toma {
  nombre: string;
  dosis: string;
}

export interface UsuarioApi {
  id: string;
  email: string;
}
