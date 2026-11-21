import { tomasEnRango, type PlanMedicamento } from './tomas';

const HORA_MS = 3_600_000;

export type Recordatorio =
  { tipo: 'diario'; hora: number; minuto: number } | { tipo: 'fecha'; fecha: Date };

/**
 * Sin fin y frecuencia que divide 24 h → recordatorios diarios repetitivos.
 * En otro caso → fechas concretas de los próximos 7 días (se renuevan al abrir la app).
 */
export function planificarRecordatorios(
  plan: PlanMedicamento,
  ahora: Date,
  maxFechas = 30,
): Recordatorio[] {
  if (plan.dias == null && 24 % plan.cada_horas === 0) {
    const inicio = new Date(plan.primera_toma).getTime();
    return Array.from({ length: 24 / plan.cada_horas }, (_, i) => {
      const t = new Date(inicio + i * plan.cada_horas * HORA_MS);
      return { tipo: 'diario' as const, hora: t.getHours(), minuto: t.getMinutes() };
    });
  }
  const hasta = new Date(ahora.getTime() + 7 * 24 * HORA_MS);
  return tomasEnRango(plan, ahora, hasta)
    .slice(0, maxFechas)
    .map((iso) => ({ tipo: 'fecha' as const, fecha: new Date(iso) }));
}
