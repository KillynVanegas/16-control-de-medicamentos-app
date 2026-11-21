import { puedeRegistrar, tomasDelDia } from '@/domain/tomas';

const hora = (iso: string) => new Date(iso).getHours();

describe('generación de tomas', () => {
  it('cada 8 h desde las 06:00 → 06:00, 14:00 y 22:00 (criterio 1)', () => {
    const primera = new Date(2026, 10, 20, 6, 0).toISOString();
    const r = tomasDelDia(
      { cada_horas: 8, primera_toma: primera, dias: null },
      new Date(2026, 10, 20, 12),
    );
    expect(r.map(hora)).toEqual([6, 14, 22]);
  });

  it('mantiene el ritmo en días posteriores', () => {
    const primera = new Date(2026, 10, 18, 6, 0).toISOString();
    const r = tomasDelDia(
      { cada_horas: 8, primera_toma: primera, dias: null },
      new Date(2026, 10, 20, 12),
    );
    expect(r.map(hora)).toEqual([6, 14, 22]);
  });

  it('respeta la duración en días', () => {
    const primera = new Date(2026, 10, 18, 6, 0).toISOString();
    const plan = { cada_horas: 12, primera_toma: primera, dias: 2 };
    expect(tomasDelDia(plan, new Date(2026, 10, 19, 12))).toHaveLength(2);
    expect(tomasDelDia(plan, new Date(2026, 10, 20, 12))).toHaveLength(0);
  });

  it('no genera tomas antes de la primera', () => {
    const primera = new Date(2026, 10, 21, 6, 0).toISOString();
    expect(
      tomasDelDia({ cada_horas: 8, primera_toma: primera, dias: null }, new Date(2026, 10, 20)),
    ).toEqual([]);
  });

  it('no permite marcar tomas futuras', () => {
    const ahora = new Date(2026, 10, 20, 10);
    expect(puedeRegistrar(new Date(2026, 10, 20, 14).toISOString(), ahora)).toBe(false);
    expect(puedeRegistrar(new Date(2026, 10, 20, 6).toISOString(), ahora)).toBe(true);
  });
});
