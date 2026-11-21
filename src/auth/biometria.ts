import * as LocalAuthentication from 'expo-local-authentication';

export type ResultadoBloqueo = 'ok' | 'cancelado' | 'sin_bloqueo';

/**
 * Huella/rostro; si no hay biometría, el bloqueo de pantalla del sistema (criterio 3).
 * Si el dispositivo no tiene ningún bloqueo, devuelve 'sin_bloqueo'.
 */
export async function autenticar(): Promise<ResultadoBloqueo> {
  try {
    const nivel = await LocalAuthentication.getEnrolledLevelAsync();
    if (nivel === LocalAuthentication.SecurityLevel.NONE) return 'sin_bloqueo';
    const r = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Desbloquee para ver sus medicamentos',
      cancelLabel: 'Cancelar',
      disableDeviceFallback: false,
    });
    return r.success ? 'ok' : 'cancelado';
  } catch {
    return 'cancelado';
  }
}
