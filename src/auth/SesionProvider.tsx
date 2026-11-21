import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Alert, AppState } from 'react-native';
import type { UsuarioApi } from '@/domain/tipos';
import { borrarSesion, obtenerToken } from './tokens';
import { ApiError, apiRequest, iniciarSesionApi, registrarApi } from '@/services/api';
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

  const informarSincronizacionPendiente = useCallback((error: unknown) => {
    const detalle = error instanceof ApiError ? ` ${error.message}` : ' Revise la conexión.';
    Alert.alert(
      'Sesión iniciada',
      `La sesión está activa, pero no se pudo sincronizar.${detalle} Puede reintentarlo desde Cuenta.`,
    );
  }, []);

  const completarAutenticacion = useCallback(
    async (r: Awaited<ReturnType<typeof iniciarSesionApi>>) => {
      setUsuario(r.usuario);
      setAutenticado(true);
      try {
        await sincronizarTodo();
      } catch (error) {
        informarSincronizacionPendiente(error);
      }
    },
    [informarSincronizacionPendiente],
  );

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
      } catch {
        await borrarSesion();
        return;
      } finally {
        setCargando(false);
      }
      try {
        await sincronizarTodo();
      } catch (error) {
        informarSincronizacionPendiente(error);
      }
    })();
  }, [informarSincronizacionPendiente]);

  const iniciarSesion = useCallback(
    async (email: string, password: string) => {
      const r = await iniciarSesionApi(email, password);
      await completarAutenticacion(r);
    },
    [completarAutenticacion],
  );

  const registrar = useCallback(
    async (email: string, password: string) => {
      const r = await registrarApi(email, password);
      await completarAutenticacion(r);
    },
    [completarAutenticacion],
  );

  const cerrarSesion = useCallback(async () => {
    await borrarSesion();
    setUsuario(null);
    setAutenticado(false);
    setDesbloqueado(false);
  }, []);

  const sincronizar = useCallback(async () => {
    await sincronizarTodo();
  }, []);

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
    [
      desbloqueado,
      autenticado,
      cargando,
      usuario,
      iniciarSesion,
      registrar,
      cerrarSesion,
      sincronizar,
    ],
  );
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}
