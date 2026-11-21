// RF-06: adherencia = tomadas / programadas (solo tomas ya vencidas).
export function calcularAdherencia(
  tomas: { programada_para: string; estado: string }[],
  ahora: Date,
): number | null {
  const programadas = tomas.filter((t) => new Date(t.programada_para).getTime() <= ahora.getTime());
  if (programadas.length === 0) return null;
  const tomadas = programadas.filter((t) => t.estado === 'tomada').length;
  return Math.round((tomadas / programadas.length) * 100);
}
