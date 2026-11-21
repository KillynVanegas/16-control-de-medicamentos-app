import { Alert, Pressable, Text } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SesionProvider, useSesion } from '@/auth/SesionProvider';
import { borrarSesion, obtenerToken } from '@/auth/tokens';
import { apiRequest, registrarApi } from '@/services/api';
import { sincronizarTodo } from '@/services/sync';

jest.mock('@/auth/tokens', () => ({
  borrarSesion: jest.fn(),
  obtenerToken: jest.fn().mockResolvedValue(null),
}));

jest.mock('@/services/api', () => ({
  ApiError: class ApiError extends Error {},
  apiRequest: jest.fn(),
  iniciarSesionApi: jest.fn(),
  registrarApi: jest.fn(),
}));

jest.mock('@/services/sync', () => ({
  sincronizarTodo: jest.fn(),
}));

function Consumidor() {
  const { autenticado, registrar } = useSesion();

  return (
    <>
      <Text>{autenticado ? 'Sesión activa' : 'Sin sesión'}</Text>
      <Pressable onPress={() => registrar('persona@example.com', 'password123')}>
        <Text>Registrar</Text>
      </Pressable>
    </>
  );
}

describe('SesionProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(obtenerToken).mockResolvedValue(null);
  });

  it('mantiene la sesión si falla la sincronización inicial y lo informa', async () => {
    const alerta = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    jest.mocked(registrarApi).mockResolvedValue({
      token: 'token',
      refreshToken: 'refresh',
      usuario: { id: '1', email: 'persona@example.com' },
      expiraEnSeg: 3600,
    });
    jest.mocked(sincronizarTodo).mockRejectedValue(new Error('falló la red'));

    render(
      <SesionProvider>
        <Consumidor />
      </SesionProvider>,
    );
    fireEvent.press(screen.getByText('Registrar'));

    await waitFor(() => {
      expect(screen.getByText('Sesión activa')).toBeTruthy();
      expect(alerta).toHaveBeenCalledWith(
        'Sesión iniciada',
        expect.stringContaining('La sesión está activa, pero no se pudo sincronizar.'),
      );
    });
  }, 15000);

  it('conserva una sesión guardada si falla la sincronización al abrir la app', async () => {
    const alerta = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    jest.mocked(obtenerToken).mockResolvedValue('token guardado');
    jest.mocked(apiRequest).mockResolvedValue({
      usuario: { id: '1', email: 'persona@example.com' },
    });
    jest.mocked(sincronizarTodo).mockRejectedValue(new Error('falló la red'));

    render(
      <SesionProvider>
        <Consumidor />
      </SesionProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Sesión activa')).toBeTruthy();
      expect(alerta).toHaveBeenCalledWith(
        'Sesión iniciada',
        expect.stringContaining('La sesión está activa, pero no se pudo sincronizar.'),
      );
    });
    expect(borrarSesion).not.toHaveBeenCalled();
  }, 15000);
});
