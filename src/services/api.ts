import Constants from 'expo-constants';
import type { UsuarioApi } from '@/domain/tipos';
import { borrarSesion, guardarSesion, obtenerRefreshToken, obtenerToken } from '@/auth/tokens';

const extra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;
export const API_URL = (
  extra?.apiUrl ?? 'https://16-control-de-medicamentos-api.vercel.app'
).replace(/\/$/, '');

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

interface SesionApi {
  token: string;
  refreshToken: string;
  usuario: UsuarioApi;
  expiraEnSeg: number;
}

async function leerError(r: Response): Promise<string> {
  try {
    const d = (await r.json()) as { error?: string };
    return d.error ?? 'No se pudo conectar con la API.';
  } catch {
    return 'No se pudo conectar con la API.';
  }
}

async function renovar(): Promise<string | null> {
  const refreshToken = await obtenerRefreshToken();
  if (!refreshToken) return null;
  const r = await fetch(`${API_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!r.ok) {
    await borrarSesion();
    return null;
  }
  const d = (await r.json()) as {
    token: string;
    refreshToken: string;
  };
  await guardarSesion(d.token, d.refreshToken);
  return d.token;
}

export async function apiRequest<T>(
  ruta: string,
  opciones: RequestInit = {},
  requiereAuth = true,
): Promise<T> {
  const headers = new Headers(opciones.headers);
  if (requiereAuth) {
    let token = await obtenerToken();
    if (!token) throw new ApiError('Debe iniciar sesión.', 401);
    headers.set('Authorization', `Bearer ${token}`);
  }
  let r = await fetch(`${API_URL}${ruta}`, { ...opciones, headers });
  if (r.status === 401 && requiereAuth) {
    const token = await renovar();
    if (!token) throw new ApiError('Sesión vencida.', 401);
    headers.set('Authorization', `Bearer ${token}`);
    r = await fetch(`${API_URL}${ruta}`, { ...opciones, headers });
  }
  if (!r.ok) throw new ApiError(await leerError(r), r.status);
  return (await r.json()) as T;
}

export async function registrarApi(email: string, password: string): Promise<SesionApi> {
  const r = await fetch(`${API_URL}/api/auth/registro`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!r.ok) throw new ApiError(await leerError(r), r.status);
  const s = (await r.json()) as SesionApi;
  await guardarSesion(s.token, s.refreshToken);
  return s;
}

export async function iniciarSesionApi(email: string, password: string): Promise<SesionApi> {
  const r = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!r.ok) throw new ApiError(await leerError(r), r.status);
  const s = (await r.json()) as SesionApi;
  await guardarSesion(s.token, s.refreshToken);
  return s;
}

export async function subirFotoApi(uri: string): Promise<{ url: string; pathname: string }> {
  const respuesta = await fetch(uri);
  const cuerpo = await respuesta.arrayBuffer();
  const extension = uri.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg';
  const token = await obtenerToken();
  if (!token) throw new ApiError('Debe iniciar sesión.', 401);
  let r = await fetch(`${API_URL}/api/imagenes`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': extension,
    },
    body: cuerpo,
  });
  if (r.status === 401) {
    const renovado = await renovar();
    if (!renovado) throw new ApiError('Sesión vencida.', 401);
    r = await fetch(`${API_URL}/api/imagenes`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${renovado}`, 'Content-Type': extension },
      body: cuerpo,
    });
  }
  if (!r.ok) throw new ApiError(await leerError(r), r.status);
  return (await r.json()) as { url: string; pathname: string };
}
