const dos = (n: number) => String(n).padStart(2, '0');

export function formatoHora(iso: string): string {
  const d = new Date(iso);
  return `${dos(d.getHours())}:${dos(d.getMinutes())}`;
}

export function formatoFechaHora(iso: string): string {
  const d = new Date(iso);
  return `${dos(d.getDate())}/${dos(d.getMonth() + 1)} ${formatoHora(iso)}`;
}

/** "06:30" -> {h, m} o null. */
export function parseHora(texto: string): { h: number; m: number } | null {
  const r = /^(\d{1,2}):(\d{2})$/.exec(texto.trim());
  if (!r) return null;
  const h = Number(r[1]);
  const m = Number(r[2]);
  return h <= 23 && m <= 59 ? { h, m } : null;
}
