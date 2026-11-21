import { Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { Medicamento } from '@/domain/tipos';
import { planificarRecordatorios } from '@/domain/recordatorios';

export const CATEGORIA = 'toma';
export const ACCION_POSPONER = 'posponer';
const CANAL = 'tomas';

export function configurarNotificaciones() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function prepararCanalYCategoria() {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CANAL, {
        name: 'Recordatorios de tomas',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }
    await Notifications.setNotificationCategoryAsync(CATEGORIA, [
      {
        identifier: ACCION_POSPONER,
        buttonTitle: 'Posponer 10 min',
        options: { opensAppToForeground: false },
      },
    ]);
  } catch {
    // La app sigue funcionando sin notificaciones.
  }
}

export async function tienePermiso(): Promise<boolean> {
  try {
    return (await Notifications.getPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

/** Explica para qué se pide el permiso y solo entonces lo solicita. */
export async function solicitarPermisoConExplicacion(): Promise<boolean> {
  try {
    const actual = await Notifications.getPermissionsAsync();
    if (actual.granted) return true;
    if (!actual.canAskAgain) return false;
    await new Promise<void>((resolver) =>
      Alert.alert(
        'Recordatorios',
        'Para avisarle a la hora de cada toma necesitamos permiso para enviar notificaciones.',
        [{ text: 'Continuar', onPress: () => resolver() }],
        { onDismiss: () => resolver() },
      ),
    );
    return (await Notifications.requestPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

export async function cancelarDeMedicamento(medicamentoId: number) {
  try {
    const todas = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      todas
        .filter((n) => n.content.data?.medicamentoId === medicamentoId)
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
    );
  } catch {
    // ignorar
  }
}

function contenido(med: { id: number; nombre: string; dosis: string }) {
  return {
    title: 'Hora de su medicamento',
    body: `${med.nombre} · ${med.dosis}`,
    categoryIdentifier: CATEGORIA,
    data: { medicamentoId: med.id, nombre: med.nombre, dosis: med.dosis },
  };
}

/** Cancela los recordatorios anteriores del medicamento y programa los nuevos. */
export async function programarMedicamento(med: Medicamento, ahora = new Date()) {
  await cancelarDeMedicamento(med.id);
  if (!med.activo || !(await tienePermiso())) return;
  const T = Notifications.SchedulableTriggerInputTypes;
  try {
    for (const r of planificarRecordatorios(med, ahora)) {
      await Notifications.scheduleNotificationAsync({
        content: contenido(med),
        trigger:
          r.tipo === 'diario'
            ? { type: T.DAILY, hour: r.hora, minute: r.minuto, channelId: CANAL }
            : { type: T.DATE, date: r.fecha, channelId: CANAL },
      });
    }
  } catch {
    // ignorar: la lista de tomas sigue siendo la fuente de verdad
  }
}

/** Reprograma una notificación igual dentro de 10 minutos (RF-04). */
export async function posponerRecordatorio(med: { id: number; nombre: string; dosis: string }) {
  if (!(await tienePermiso())) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: contenido(med),
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 600,
        channelId: CANAL,
      },
    });
  } catch {
    // ignorar
  }
}
