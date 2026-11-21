import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
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

export default function NuevoMedicamento() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const medId = id ? Number(id) : undefined;
  const [nombre, setNombre] = useState('');
  const [dosis, setDosis] = useState('');
  const [cada, setCada] = useState('8');
  const [dias, setDias] = useState('');
  const [hora, setHora] = useState('08:00');
  const [fechaBase, setFechaBase] = useState(new Date());
  const [errores, setErrores] = useState<Errores>({});
  const [guardando, setGuardando] = useState(false);

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
    });
  }, [medId]);

  async function guardar() {
    setGuardando(true);
    try {
      const r = await guardarMedicamento(
        { nombre, dosis, cada_horas: cada, dias, hora, fechaBase },
        medId,
      );
      if (!r.ok) {
        setErrores(r.errores);
        return;
      }
      // El permiso se pide aquí, cuando la persona activa la función, y se explica para qué.
      await solicitarPermisoConExplicacion();
      await sincronizarRecordatorios(r.id);
      router.back();
    } catch {
      Alert.alert('No se pudo guardar', 'Intente de nuevo.');
    } finally {
      setGuardando(false);
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
