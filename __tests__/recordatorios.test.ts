import { planificarRecordatorios } from '@/domain/recordatorios';

const ahora = new Date(2026, 10, 20, 12);

describe('planificación de recordatorios', () => {
  it('frecuencia que divide 24 h y sin fin → diarios repetitivos', () => {
    const r = planificarRecordatorios(
      { cada_horas: 8, primera_toma: new Date(2026, 10, 20, 6).toISOString(), dias: null },
      ahora,
    );
    expect(r.map((x) => (x.tipo === 'diario' ? x.hora : -1))).toEqual([6, 14, 22]);
  });
  it('otra frecuencia → fechas concretas futuras', () => {
    const r = planificarRecordatorios(
      { cada_horas: 5, primera_toma: new Date(2026, 10, 20, 6).toISOString(), dias: null },
      ahora,
    );
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((x) => x.tipo === 'fecha' && x.fecha > ahora)).toBe(true);
  });
});
