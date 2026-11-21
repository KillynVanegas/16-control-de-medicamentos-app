import * as SecureStore from 'expo-secure-store';
import { nuevoUuid } from '@/domain/uuid';
import * as medRepo from '@/repositories/medicamentos';
import * as tomaRepo from '@/repositories/tomas';
import { apiRequest, subirFotoApi } from './api';

const CURSOR_MED = 'sync_medicamentos_cursor';
const CURSOR_TOMA = 'sync_tomas_cursor';

interface ListaRemota<T> {
  items: T[];
  servidor_ahora: string;
}

interface MedicamentoRemoto {
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
}

interface TomaRemota {
  id: string;
  medicamento_id: string;
  programada_para: string;
  estado: 'pendiente' | 'tomada' | 'omitida';
  registrada_en: string | null;
  deleted_at: string | null;
  updated_at: string;
}

async function fotoRemota(uri: string | null): Promise<string | null> {
  if (!uri) return null;
  if (/^(file:|content:|data:)/i.test(uri)) return (await subirFotoApi(uri)).url;
  return uri;
}

async function subirMedicamentos() {
  for (const med of await medRepo.listarPendientes()) {
    let remoteId = med.remote_id;
    if (!remoteId) {
      remoteId = nuevoUuid();
      await medRepo.establecerRemoteId(med.id, remoteId);
    }
    if (med.eliminado) {
      if (med.remote_id) await apiRequest(`/api/medicamento/${remoteId}`, { method: 'DELETE' });
      continue;
    }
    const fotoUrl = await fotoRemota(med.foto_uri);
    await apiRequest(`/api/medicamento/${remoteId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: med.nombre,
        dosis: med.dosis,
        cada_horas: med.cada_horas,
        primera_toma: med.primera_toma,
        dias: med.dias,
        activo: med.activo === 1,
        foto_url: fotoUrl,
      }),
    });
    await medRepo.marcarSincronizado(med.id, new Date().toISOString());
  }
}

async function subirTomas() {
  for (const toma of await tomaRepo.listarPendientes()) {
    const med = await medRepo.obtenerMedicamento(toma.medicamento_id);
    if (!med?.remote_id) continue;
    let remoteId = toma.remote_id;
    if (!remoteId) {
      remoteId = nuevoUuid();
      await tomaRepo.establecerRemoteId(toma.id, remoteId);
    }
    await apiRequest(`/api/toma/${remoteId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        medicamento_id: med.remote_id,
        programada_para: toma.programada_para,
        estado: toma.estado,
        registrada_en: toma.registrada_en,
      }),
    });
    await tomaRepo.marcarSincronizado(toma.id, new Date().toISOString());
  }
}

async function descargarMedicamentos() {
  const cursor = await SecureStore.getItemAsync(CURSOR_MED);
  const ruta = cursor ? `/api/medicamento?since=${encodeURIComponent(cursor)}` : '/api/medicamento';
  const r = await apiRequest<ListaRemota<MedicamentoRemoto>>(ruta);
  for (const med of r.items) await medRepo.aplicarRemoto(med);
  await SecureStore.setItemAsync(CURSOR_MED, r.servidor_ahora);
}

async function descargarTomas() {
  const cursor = await SecureStore.getItemAsync(CURSOR_TOMA);
  const ruta = cursor ? `/api/toma?since=${encodeURIComponent(cursor)}` : '/api/toma';
  const r = await apiRequest<ListaRemota<TomaRemota>>(ruta);
  for (const toma of r.items) await tomaRepo.aplicarRemoto(toma);
  await SecureStore.setItemAsync(CURSOR_TOMA, r.servidor_ahora);
}

export async function sincronizarTodo(): Promise<void> {
  await subirMedicamentos();
  await subirTomas();
  await descargarMedicamentos();
  await descargarTomas();
}
