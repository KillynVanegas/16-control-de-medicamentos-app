// Lógica pura: generación de tomas a partir de la frecuencia (RF-02).
const HORA_MS = 3_600_000;

export interface PlanMedicamento {
  cada_horas: number;
  primera_toma: string; // ISO
  dias: number | null; // duración; null = sin fin
}

/** Tomas (ISO UTC) con desde <= toma < hasta. */
export function tomasEnRango(plan: PlanMedicamento, desde: Date, hasta: Date): string[] {
  const inicio = new Date(plan.primera_toma).getTime();
  const paso = plan.cada_horas * HORA_MS;
  if (!Number.isFinite(inicio) || paso <= 0) return [];
  const fin = plan.dias == null ? Infinity : inicio + plan.dias * 24 * HORA_MS;
  let k = Math.max(0, Math.ceil((desde.getTime() - inicio) / paso));
  const salida: string[] = [];
  let t = inicio + k * paso;
  while (t < hasta.getTime() && t < fin) {
    salida.push(new Date(t).toISOString());
    k += 1;
    t = inicio + k * paso;
  }
  return salida;
}

/** Tomas del día local de `dia`. */
export function tomasDelDia(plan: PlanMedicamento, dia: Date): string[] {
  const ini = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate());
  const fin = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate() + 1);
  return tomasEnRango(plan, ini, fin);
}

/** No se permite marcar tomas futuras. */
export function puedeRegistrar(programadaPara: string, ahora: Date): boolean {
  return new Date(programadaPara).getTime() <= ahora.getTime();
}
