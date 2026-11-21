import { parseHora } from './formato';

export interface EntradaMedicamento {
  nombre: string;
  dosis: string;
  cada_horas: string;
  dias: string;
  hora: string; // HH:MM de la primera toma
  fechaBase: Date; // día de la primera toma
  foto_uri?: string | null;
}

export type Errores = Partial<Record<'nombre' | 'dosis' | 'cada_horas' | 'dias' | 'hora', string>>;

export interface ValorMedicamento {
  nombre: string;
  dosis: string;
  cada_horas: number;
  dias: number | null;
  primera_toma: string;
  foto_uri: string | null;
}

export function validarMedicamento(e: EntradaMedicamento): {
  errores: Errores;
  valor?: ValorMedicamento;
} {
  const errores: Errores = {};
  const nombre = e.nombre.trim();
  const dosis = e.dosis.trim();
  if (!nombre) errores.nombre = 'Escriba el nombre del medicamento.';
  if (!dosis) errores.dosis = 'Escriba la dosis (por ejemplo, 1 tableta).';

  const cada = Number(e.cada_horas);
  if (e.cada_horas.trim() === '' || !Number.isInteger(cada) || cada < 1 || cada > 48)
    errores.cada_horas = 'Use un número entero de horas entre 1 y 48.';

  let dias: number | null = null;
  if (e.dias.trim() !== '') {
    dias = Number(e.dias);
    if (!Number.isInteger(dias) || dias < 1)
      errores.dias = 'Use un número entero de días (1 o más).';
  }

  const hora = parseHora(e.hora);
  if (!hora) errores.hora = 'Use el formato HH:MM, por ejemplo 06:00.';

  if (Object.keys(errores).length > 0 || !hora) return { errores };
  const f = e.fechaBase;
  const primera = new Date(f.getFullYear(), f.getMonth(), f.getDate(), hora.h, hora.m);
  return {
    errores,
    valor: {
      nombre,
      dosis,
      cada_horas: cada,
      dias,
      primera_toma: primera.toISOString(),
      foto_uri: e.foto_uri ?? null,
    },
  };
}
