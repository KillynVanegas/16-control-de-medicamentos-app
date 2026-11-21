import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Boton } from '@/components/Boton';
import { TomaCard } from '@/components/TomaCard';
import type { TomaConMedicamento } from '@/domain/tipos';
import { useShake } from '@/sensors/useShake';
import {
  adherenciaSemanal,
  asegurarTomasDeHoy,
  marcarToma,
  reprogramarTodos,
  tomasDeHoy,
} from '@/services/medicamentos';
import { posponerRecordatorio } from '@/services/notificaciones';
import { colores, tamanos } from '@/theme';

export default function Hoy() {
  const [tomas, setTomas] = useState<TomaConMedicamento[]>([]);
  const [adherencia, setAdherencia] = useState<number | null>(null);
  const [ahora, setAhora] = useState(new Date());
  const [silenciada, setSilenciada] = useState(false);

  const cargar = useCallback(async () => {
    const n = new Date();
    await asegurarTomasDeHoy(n);
    setTomas(await tomasDeHoy(n));
    setAdherencia(await adherenciaSemanal(n));
    setAhora(n);
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
      reprogramarTodos();
      const t = setInterval(() => setAhora(new Date()), 30_000);
      return () => clearInterval(t);
    }, [cargar]),
  );

  const vencidas = tomas.filter(
    (t) => t.estado === 'pendiente' && new Date(t.programada_para) <= ahora,
  );
  const alarmaActiva = vencidas.length > 0 && !silenciada;

  useEffect(() => {
    if (vencidas.length === 0) setSilenciada(false);
  }, [vencidas.length]);

  // Sensor: sacudir silencia la alarma (alternativa: botón «Silenciar»).
  useShake(() => setSilenciada(true), alarmaActiva);

  useEffect(() => {
    if (!alarmaActiva) return;
    const t = setInterval(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    }, 3000);
    return () => clearInterval(t);
  }, [alarmaActiva]);

  async function registrar(t: TomaConMedicamento, estado: 'tomada' | 'omitida') {
    try {
      await marcarToma(t, estado);
      await cargar();
    } catch (e) {
      Alert.alert('No se pudo registrar', e instanceof Error ? e.message : 'Intente de nuevo.');
    }
  }

  return (
    <View style={estilos.pantalla}>
      <Text style={estilos.resumen} accessibilityRole="summary">
        Adherencia de la semana: {adherencia == null ? 'sin datos' : `${adherencia} %`}
      </Text>
      {alarmaActiva && (
        <View style={estilos.alarma} accessibilityLiveRegion="polite">
          <Text style={estilos.alarmaTexto}>Tiene {vencidas.length} toma(s) por registrar.</Text>
          <Boton
            titulo="Silenciar"
            accessibilityLabel="Silenciar la alarma"
            color={colores.alerta}
            onPress={() => setSilenciada(true)}
          />
          <Text style={estilos.alarmaPista}>También puede sacudir el teléfono.</Text>
        </View>
      )}
      <FlatList
        data={tomas}
        keyExtractor={(t) => String(t.id)}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <Text style={estilos.vacio}>
            No hay tomas para hoy. Agregue un medicamento en la pestaña «Medicamentos».
          </Text>
        }
        ListFooterComponent={
          tomas.length > 0 ? (
            <Text style={estilos.pista}>
              Deslice a la derecha para marcar tomada, a la izquierda para omitir, o mantenga
              pulsado para posponer 10 min. También puede usar los botones.
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <TomaCard
            toma={item}
            ahora={ahora}
            onTomada={() => registrar(item, 'tomada')}
            onOmitida={() => registrar(item, 'omitida')}
            onPosponer={() => {
              posponerRecordatorio({
                id: item.medicamento_id,
                nombre: item.nombre,
                dosis: item.dosis,
              });
              Alert.alert('Pospuesto', 'Le avisaremos de nuevo en 10 minutos.');
            }}
          />
        )}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, padding: 16, backgroundColor: colores.fondo },
  resumen: { fontSize: tamanos.texto, fontWeight: '700', color: colores.texto, marginBottom: 12 },
  alarma: {
    backgroundColor: '#FDECEA',
    borderColor: colores.alerta,
    borderWidth: 2,
    borderRadius: 14,
    padding: 14,
    gap: 8,
    marginBottom: 12,
  },
  alarmaTexto: { fontSize: tamanos.texto, fontWeight: '700', color: colores.alerta },
  alarmaPista: { fontSize: 16, color: colores.textoSuave },
  vacio: { fontSize: tamanos.texto, color: colores.textoSuave, marginTop: 24 },
  pista: { fontSize: 16, color: colores.textoSuave, marginTop: 8 },
});
