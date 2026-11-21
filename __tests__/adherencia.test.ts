import { calcularAdherencia } from '@/domain/adherencia';

const ahora = new Date(2026, 10, 20, 12);
const t = (h: number, estado: string) => ({
  programada_para: new Date(2026, 10, 20, h).toISOString(),
  estado,
});

describe('adherencia = tomadas / programadas', () => {
  it('calcula el porcentaje sobre tomas vencidas', () => {
    expect(
      calcularAdherencia(
        [t(6, 'tomada'), t(8, 'omitida'), t(10, 'pendiente'), t(11, 'tomada')],
        ahora,
      ),
    ).toBe(50);
  });
  it('ignora tomas futuras', () => {
    expect(calcularAdherencia([t(6, 'tomada'), t(22, 'pendiente')], ahora)).toBe(100);
  });
  it('sin tomas vencidas devuelve null', () => {
    expect(calcularAdherencia([t(22, 'pendiente')], ahora)).toBeNull();
  });
});
