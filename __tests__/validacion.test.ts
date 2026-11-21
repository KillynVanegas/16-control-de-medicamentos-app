import { validarMedicamento } from '@/domain/validacion';

const base = {
  nombre: 'Ibuprofeno',
  dosis: '1 tableta',
  cada_horas: '8',
  dias: '',
  hora: '06:00',
  fechaBase: new Date(2026, 10, 20),
};

describe('validación', () => {
  it('acepta datos correctos', () => {
    const r = validarMedicamento(base);
    expect(r.valor?.cada_horas).toBe(8);
    expect(r.valor?.dias).toBeNull();
  });
  it('exige nombre y dosis', () => {
    const r = validarMedicamento({ ...base, nombre: ' ', dosis: '' });
    expect(r.errores.nombre).toBeDefined();
    expect(r.errores.dosis).toBeDefined();
  });
  it('rechaza frecuencias fuera de 1–48 y horas inválidas', () => {
    expect(validarMedicamento({ ...base, cada_horas: '0' }).errores.cada_horas).toBeDefined();
    expect(validarMedicamento({ ...base, cada_horas: '49' }).errores.cada_horas).toBeDefined();
    expect(validarMedicamento({ ...base, hora: '25:00' }).errores.hora).toBeDefined();
  });
});
