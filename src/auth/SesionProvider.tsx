import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import type { UsuarioApi } from '@/domain/tipos';
import { borrarSesion, obtenerToken } from './tokens';
import { apiRequest, iniciarSesionApi, registrarApi } from '@/services/api';
import { sincronizarTodo } from '@/services/sync';

interface Sesion {
  desbloqueado: boolean;
  setDesbloqueado: (v: boolean) => void;
  autenticado: boolean;
  cargando: boolean;
  usuario: UsuarioApi | null;
  iniciarSesion: (email: string, password: string) => Promise<void>;
  registrar: (email: string, password: string) => Promise<void>;
  cerrarSesion: () => Promise<void>;
  sincronizar: () => Promise<void>;
}

const Ctx = createContext<Sesion>({
  desbloqueado: false,
  setDesbloqueado: () => {},
  autenticado: false,
  cargando: true,
  usuario: null,
  iniciarSesion: async () => {},
  registrar: async () => {},
  cerrarSesion: async () => {},
  sincronizar: async () => {},
});
export const useSesion = () => useContext(Ctx);

export function SesionProvider({ children }: { children: ReactNode }) {
  const [desbloqueado, setDesbloqueado] = useState(false);
  const [autenticado, setAutenticado] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [usuario, setUsuario] = useState<UsuarioApi | null>(null);

  // Al pasar a segundo plano se vuelve a bloquear (datos de salud sensibles).
  useEffect(() => {
    const sub = AppState.addEventListener('change', (estado) => {
      if (estado === 'background') setDesbloqueado(false);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const token = await obtenerToken();
        if (!token) return;
        const r = await apiRequest<{ usuario: UsuarioApi }>('/api/auth/yo');
        setUsuario(r.usuario);
        setAutenticado(true);
        await sincronizarTodo();
      } catch {
        await borrarSesion();
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  async function iniciarSesion(email: string, password: string) {
    const r = await iniciarSesionApi(email, password);
    setUsuario(r.usuario);
    setAutenticado(true);
    await sincronizarTodo();
  }

  async function registrar(email: string, password: string) {
    const r = await registrarApi(email, password);
    setUsuario(r.usuario);
    setAutenticado(true);
    await sincronizarTodo();
  }

  async function cerrarSesion() {
    await borrarSesion();
    setUsuario(null);
    setAutenticado(false);
    setDesbloqueado(false);
  }

  async function sincronizar() {
    await sincronizarTodo();
  }

  const valor = useMemo(
    () => ({
      desbloqueado,
      setDesbloqueado,
      autenticado,
      cargando,
      usuario,
      iniciarSesion,
      registrar,
      cerrarSesion,
      sincronizar,
    }),
    [desbloqueado, autenticado, cargando, usuario],
  );
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}
