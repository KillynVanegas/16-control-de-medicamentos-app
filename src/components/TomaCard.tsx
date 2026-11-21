import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { formatoHora } from '@/domain/formato';
import type { TomaConMedicamento } from '@/domain/tipos';
import { puedeRegistrar } from '@/domain/tomas';
import { colores, tamanos } from '@/theme';
import { AccionesToma } from './AccionesToma';

interface Props {
  toma: TomaConMedicamento;
  ahora: Date;
  onTomada: () => void;
  onOmitida: () => void;
  onPosponer: () => void;
}

const UMBRAL = 100;

const ETIQUETA = { pendiente: 'Pendiente', tomada: 'Tomada', omitida: 'Omitida' } as const;

function vibrar() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

export function TomaCard({ toma, ahora, onTomada, onOmitida, onPosponer }: Props) {
  const x = useSharedValue(0);
  const habilitado = toma.estado === 'pendiente' && puedeRegistrar(toma.programada_para, ahora);

  const pan = Gesture.Pan()
    .runOnJS(true)
    .enabled(habilitado)
    .activeOffsetX([-15, 15])
    .failOffsetY([-15, 15])
    .onUpdate((e) => {
      x.value = e.translationX;
    })
    .onEnd((e) => {
      if (e.translationX > UMBRAL) {
        vibrar();
        onTomada(); // deslizar a la derecha → tomada
      } else if (e.translationX < -UMBRAL) {
        vibrar();
        onOmitida(); // deslizar a la izquierda → omitir
      }
      x.value = withSpring(0);
    });

  const largo = Gesture.LongPress()
    .runOnJS(true)
    .enabled(habilitado)
    .minDuration(600)
    .onStart(() => {
      vibrar();
      onPosponer(); // pulsación larga → posponer 10 min
    });

  const estiloAnimado = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <GestureDetector gesture={Gesture.Race(pan, largo)}>
      <Animated.View style={[estilos.tarjeta, estiloAnimado]}>
        <View style={estilos.cabecera}>
          <Text style={estilos.hora}>{formatoHora(toma.programada_para)}</Text>
          <Text style={[estilos.estado, toma.estado === 'tomada' && { color: colores.tomada }]}>
            {ETIQUETA[toma.estado]}
          </Text>
        </View>
        <Text style={estilos.nombre}>{toma.nombre}</Text>
        <Text style={estilos.dosis}>{toma.dosis}</Text>
        {toma.estado === 'pendiente' && (
          <>
            {!habilitado && <Text style={estilos.dosis}>Aún no es la hora.</Text>}
            <AccionesToma
              nombre={toma.nombre}
              habilitado={habilitado}
              onTomada={onTomada}
              onOmitida={onOmitida}
              onPosponer={onPosponer}
            />
          </>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    backgroundColor: colores.superficie,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  cabecera: { flexDirection: 'row', justifyContent: 'space-between' },
  hora: { fontSize: tamanos.titulo, fontWeight: '800', color: colores.primario },
  estado: { fontSize: tamanos.texto, color: colores.textoSuave, fontWeight: '600' },
  nombre: { fontSize: 22, fontWeight: '700', color: colores.texto, marginTop: 4 },
  dosis: { fontSize: tamanos.texto, color: colores.textoSuave },
});
