import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import { SesionProvider, useSesion } from '@/auth/SesionProvider';
import {
  ACCION_POSPONER,
  configurarNotificaciones,
  posponerRecordatorio,
  prepararCanalYCategoria,
} from '@/services/notificaciones';

configurarNotificaciones();

function Navegacion() {
  const { autenticado, desbloqueado } = useSesion();
  useEffect(() => {
    prepararCanalYCategoria();
    // RF-04: acción «Posponer 10 min» desde la notificación.
    const sub = Notifications.addNotificationResponseReceivedListener((resp) => {
      if (resp.actionIdentifier !== ACCION_POSPONER) return;
      const d = resp.notification.request.content.data as {
        medicamentoId?: number;
        nombre?: string;
        dosis?: string;
      };
      if (typeof d.medicamentoId === 'number')
        posponerRecordatorio({ id: d.medicamentoId, nombre: d.nombre ?? '', dosis: d.dosis ?? '' });
    });
    return () => sub.remove();
  }, []);

  return (
    <Stack screenOptions={{ headerTitleStyle: { fontSize: 20 } }}>
      <Stack.Protected guard={!autenticado}>
        <Stack.Screen name="auth" options={{ title: 'Cuenta', headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={autenticado && !desbloqueado}>
        <Stack.Screen name="bloqueo" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={autenticado && desbloqueado}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="medicamento/nuevo" options={{ title: 'Medicamento' }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SesionProvider>
        <StatusBar style="dark" />
        <Navegacion />
      </SesionProvider>
    </GestureHandlerRootView>
  );
}
