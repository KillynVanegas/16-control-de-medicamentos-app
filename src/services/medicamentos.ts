import { calcularAdherencia } from '@/domain/adherencia';
import type { EstadoToma, Medicamento, Toma, TomaConMedicamento } from '@/domain/tipos';
import { puedeRegistrar, tomasDelDia } from '@/domain/tomas';
import { validarMedicamento, type EntradaMedicamento, type Errores } from '@/domain/validacion';
import * as medRepo from '@/repositories/medicamentos';
import * as tomaRepo from '@/repositories/tomas';
import { cancelarDeMedicamento, programarMedicamento } from './notificaciones';

export { listarMedicamentos, obtenerMedicamento } from '@/repositories/medicamentos';

const DIA_MS = 86_400_000;

export type ResultadoGuardar = { ok: true; id: number } | { ok: false; errores: Errores };

export async function guardarMedicamento(
  entrada: EntradaMedicamento,
  id?: number,
): Promise<ResultadoGuardar> {
  const { errores, valor } = validarMedicamento(entrada);
  if (!valor) return { ok: false, errores };
  let medId = id;
  if (id == null) {
    medId = await medRepo.crearMedicamento(valor);
  } else {
    await medRepo.actualizarMedicamento(id, valor);
    // Criterio 2: al editar la frecuencia se descartan las tomas pendientes y se regeneran.
    await tomaRepo.borrarPendientesDesde(id, new Date(Date.now() - DIA_MS).toISOString());
  }
  await asegurarTomasDeHoy(new Date());
  return { ok: true, id: medId as number };
}

export async function sincronizarRecordatorios(id: number) {
  const med = await medRepo.obtenerMedicamento(id);
  if (med) await programarMedicamento(med);
}

export async function reprogramarTodos() {
  for (const m of await medRepo.listarMedicamentos()) await programarMedicamento(m);
}

export async function eliminarMedicamento(id: number) {
  await cancelarDeMedicamento(id);
  await medRepo.eliminarMedicamento(id);
}

/** Crea (si faltan) las tomas de hoy de todos los medicamentos activos. */
export async function asegurarTomasDeHoy(ahora: Date) {
  const meds: Medicamento[] = await medRepo.listarMedicamentos();
  for (const m of meds)
    for (const iso of tomasDelDia(m, ahora)) await tomaRepo.insertarTomaSiNoExiste(m.id, iso);
}

export async function tomasDeHoy(ahora: Date): Promise<TomaConMedicamento[]> {
  const ini = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  const fin = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + 1);
  return tomaRepo.listarEnRango(ini.toISOString(), fin.toISOString());
}

export async function historial() {
  return tomaRepo.listarHistorial();
}

export async function marcarToma(toma: Toma, estado: Exclude<EstadoToma, 'pendiente'>) {
  const ahora = new Date();
  if (!puedeRegistrar(toma.programada_para, ahora))
    throw new Error('Todavía no es la hora de esta toma.');
  await tomaRepo.marcar(toma.id, estado, ahora.toISOString());
}

export async function adherenciaSemanal(ahora: Date): Promise<number | null> {
  const desde = new Date(ahora.getTime() - 7 * DIA_MS).toISOString();
  return calcularAdherencia(await tomaRepo.listarDesde(desde), ahora);
}
