import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Boton } from '@/components/Boton';
import { formatoHora } from '@/domain/formato';
import type { Errores } from '@/domain/validacion';
import {
  guardarMedicamento,
  obtenerMedicamento,
  sincronizarRecordatorios,
} from '@/services/medicamentos';
import { solicitarPermisoConExplicacion } from '@/services/notificaciones';
import { colores, tamanos } from '@/theme';

function Campo(props: {
  etiqueta: string;
  valor: string;
  onChange: (v: string) => void;
  error?: string;
  teclado?: 'default' | 'numeric';
  ayuda?: string;
}) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={estilos.etiqueta}>{props.etiqueta}</Text>
      <TextInput
        style={[estilos.input, props.error ? { borderColor: colores.alerta } : null]}
        value={props.valor}
        onChangeText={props.onChange}
        keyboardType={props.teclado ?? 'default'}
        accessibilityLabel={props.etiqueta}
      />
      {props.ayuda && !props.error ? <Text style={estilos.ayuda}>{props.ayuda}</Text> : null}
      {props.error ? (
        <Text style={estilos.error} accessibilityLiveRegion="polite">
          {props.error}
        </Text>
      ) : null}
    </View>
  );
}

function mensajeError(error: unknown) {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
}

export default function NuevoMedicamento() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const medId = id ? Number(id) : undefined;
  const [nombre, setNombre] = useState('');
  const [dosis, setDosis] = useState('');
  const [cada, setCada] = useState('8');
  const [dias, setDias] = useState('');
  const [hora, setHora] = useState('08:00');
  const [fechaBase, setFechaBase] = useState(new Date());
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [errores, setErrores] = useState<Errores>({});
  const [guardando, setGuardando] = useState(false);
  const escala = useSharedValue(1);
  const pellizco = Gesture.Pinch()
    .onUpdate((evento) => {
      escala.value = Math.min(4, Math.max(1, evento.scale));
    })
    .onEnd(() => {
      if (escala.value < 1.05) escala.value = withSpring(1);
    });
  const estiloFoto = useAnimatedStyle(() => ({ transform: [{ scale: escala.value }] }));

  useEffect(() => {
    if (medId == null) return;
    obtenerMedicamento(medId).then((m) => {
      if (!m) return;
      setNombre(m.nombre);
      setDosis(m.dosis);
      setCada(String(m.cada_horas));
      setDias(m.dias == null ? '' : String(m.dias));
      setHora(formatoHora(m.primera_toma));
      setFechaBase(new Date(m.primera_toma));
      setFotoUri(m.foto_uri);
    });
  }, [medId]);

  async function seleccionarFoto(camara: boolean) {
    const permiso = camara
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert('Permiso requerido', 'No se pudo acceder a la foto del empaque.');
      return;
    }
    const resultado = camara
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!resultado.canceled) {
      escala.value = 1;
      setFotoUri(resultado.assets[0]?.uri ?? null);
    }
  }

  async function guardar() {
    setGuardando(true);
    let resultado: Awaited<ReturnType<typeof guardarMedicamento>>;
    try {
      resultado = await guardarMedicamento(
        { nombre, dosis, cada_horas: cada, dias, hora, fechaBase, foto_uri: fotoUri },
        medId,
      );
    } catch (error) {
      Alert.alert('No se pudo guardar', mensajeError(error));
      return;
    } finally {
      setGuardando(false);
    }

    if (!resultado.ok) {
      setErrores(resultado.errores);
      return;
    }

    router.back();
    try {
      // El permiso se pide aquí, cuando la persona activa la función, y se explica para qué.
      await solicitarPermisoConExplicacion();
      await sincronizarRecordatorios(resultado.id);
    } catch (error) {
      Alert.alert(
        'Medicamento guardado',
        `No se pudieron configurar sus recordatorios. ${mensajeError(error)}`,
      );
    }
  }

  return (
    <ScrollView contentContainerStyle={estilos.pantalla} keyboardShouldPersistTaps="handled">
      <Campo etiqueta="Nombre" valor={nombre} onChange={setNombre} error={errores.nombre} />
      <Campo
        etiqueta="Dosis"
        valor={dosis}
        onChange={setDosis}
        error={errores.dosis}
        ayuda="Por ejemplo: 1 tableta o 5 ml"
      />
      <Campo
        etiqueta="Cada cuántas horas"
        valor={cada}
        onChange={setCada}
        error={errores.cada_horas}
        teclado="numeric"
        ayuda="Entre 1 y 48 horas"
      />
      <Campo
        etiqueta="Hora de la primera toma"
        valor={hora}
        onChange={setHora}
        error={errores.hora}
        ayuda="Formato 24 h, por ejemplo 06:00"
      />
      <Campo
        etiqueta="Duración en días (opcional)"
        valor={dias}
        onChange={setDias}
        error={errores.dias}
        teclado="numeric"
        ayuda="Déjelo vacío si no tiene fin"
      />
      <Text style={estilos.etiqueta}>Foto del empaque (opcional)</Text>
      {fotoUri && (
        <GestureDetector gesture={pellizco}>
          <Animated.View style={estilos.fotoContenedor}>
            <Animated.Image source={{ uri: fotoUri }} style={[estilos.foto, estiloFoto]} />
          </Animated.View>
        </GestureDetector>
      )}
      <View style={estilos.fila}>
        <Boton
          titulo="Tomar foto"
          accessibilityLabel="Tomar foto del empaque"
          flex
          onPress={() => seleccionarFoto(true)}
        />
        <Boton
          titulo="Elegir foto"
          accessibilityLabel="Elegir foto del empaque de la galeria"
          flex
          onPress={() => seleccionarFoto(false)}
        />
      </View>
      {fotoUri && (
        <Boton
          titulo="Quitar foto"
          accessibilityLabel="Quitar foto del empaque"
          color={colores.textoSuave}
          onPress={() => setFotoUri(null)}
        />
      )}
      <Boton
        titulo={guardando ? 'Guardando…' : 'Guardar'}
        deshabilitado={guardando}
        onPress={guardar}
      />
      <Boton titulo="Cancelar" color={colores.textoSuave} onPress={() => router.back()} />
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  pantalla: { padding: 16, gap: 14, backgroundColor: colores.fondo },
  etiqueta: { fontSize: tamanos.texto, fontWeight: '700', color: colores.texto },
  fila: { flexDirection: 'row', gap: 8 },
  fotoContenedor: {
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colores.superficie,
  },
  foto: { width: '100%', height: '100%', resizeMode: 'contain' },
  input: {
    backgroundColor: colores.superficie,
    borderWidth: 1.5,
    borderColor: colores.borde,
    borderRadius: 12,
    padding: 14,
    fontSize: tamanos.texto,
    color: colores.texto,
  },
  ayuda: { fontSize: 15, color: colores.textoSuave },
  error: { fontSize: 16, color: colores.alerta, fontWeight: '600' },
});
