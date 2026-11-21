import * as SecureStore from 'expo-secure-store';

const TOKEN = 'medicamentos_token';
const REFRESH = 'medicamentos_refresh';

export async function guardarSesion(token: string, refreshToken: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN, token);
  await SecureStore.setItemAsync(REFRESH, refreshToken);
}

export async function obtenerToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN);
}

export async function obtenerRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH);
}

export async function borrarSesion(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN);
  await SecureStore.deleteItemAsync(REFRESH);
}
