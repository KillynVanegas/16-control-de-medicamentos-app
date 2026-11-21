import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useSesion } from '@/auth/SesionProvider';
import { Boton } from '@/components/Boton';
import { colores, tamanos } from '@/theme';

export default function Cuenta() {
  const { usuario, sincronizar, cerrarSesion } = useSesion();
  const [procesando, setProcesando] = useState(false);

  async function ejecutarSincronizacion() {
    setProcesando(true);
    try {
      await sincronizar();
      Alert.alert('Sincronización completa', 'Los datos locales están actualizados.');
    } catch {
      Alert.alert('Sin conexión', 'Los cambios se conservarán y podrán sincronizarse después.');
    } finally {
      setProcesando(false);
    }
  }

  function confirmarSalida() {
    Alert.alert('Cerrar sesión', '¿Desea cerrar la sesión en este dispositivo?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: cerrarSesion },
    ]);
  }

  return (
    <View style={estilos.pantalla}>
      <Text style={estilos.titulo}>Cuenta</Text>
      <Text style={estilos.email}>{usuario?.email ?? 'Sin usuario'}</Text>
      <Boton
        titulo={procesando ? 'Sincronizando…' : 'Sincronizar ahora'}
        deshabilitado={procesando}
        onPress={ejecutarSincronizacion}
      />
      <Boton titulo="Cerrar sesión" color={colores.alerta} onPress={confirmarSalida} />
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, padding: 16, gap: 12, backgroundColor: colores.fondo },
  titulo: { fontSize: 28, fontWeight: '800', color: colores.texto },
  email: { fontSize: tamanos.texto, color: colores.textoSuave, marginBottom: 8 },
});
