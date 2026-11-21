import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

interface Sesion {
  desbloqueado: boolean;
  setDesbloqueado: (v: boolean) => void;
}

const Ctx = createContext<Sesion>({ desbloqueado: false, setDesbloqueado: () => {} });
export const useSesion = () => useContext(Ctx);

export function SesionProvider({ children }: { children: ReactNode }) {
  const [desbloqueado, setDesbloqueado] = useState(false);

  // Al pasar a segundo plano se vuelve a bloquear (datos de salud sensibles).
  useEffect(() => {
    const sub = AppState.addEventListener('change', (estado) => {
      if (estado === 'background') setDesbloqueado(false);
    });
    return () => sub.remove();
  }, []);

  const valor = useMemo(() => ({ desbloqueado, setDesbloqueado }), [desbloqueado]);
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}
