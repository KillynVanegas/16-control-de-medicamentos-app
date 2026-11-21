import { esSacudida } from '@/domain/shake';

describe('sacudida', () => {
  it('en reposo no es sacudida', () => expect(esSacudida(0, 0, 1)).toBe(false));
  it('una aceleración fuerte sí lo es', () => expect(esSacudida(2, 1.5, 1.5)).toBe(true));
});
