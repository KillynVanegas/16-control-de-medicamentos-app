import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSesion } from '@/auth/SesionProvider';
import { Boton } from '@/components/Boton';
import { ApiError } from '@/services/api';
import { colores, tamanos } from '@/theme';

export default function Auth() {
  const { cargando, iniciarSesion, registrar } = useSesion();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [modoRegistro, setModoRegistro] = useState(false);

  async function enviar() {
    setProcesando(true);
    try {
      if (modoRegistro) await registrar(email.trim(), password);
      else await iniciarSesion(email.trim(), password);
    } catch (error) {
      Alert.alert(
        'No se pudo continuar',
        error instanceof ApiError ? error.message : 'Revise la conexión e inténtelo de nuevo.',
      );
    } finally {
      setProcesando(false);
    }
  }

  if (cargando) {
    return (
      <View style={estilos.carga}>
        <ActivityIndicator size="large" color={colores.primario} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={estilos.pantalla} keyboardShouldPersistTaps="handled">
      <Text style={estilos.titulo}>Control de medicamentos</Text>
      <Text style={estilos.texto}>
        {modoRegistro
          ? 'Cree una cuenta para sincronizar sus datos.'
          : 'Inicie sesión para sincronizar sus datos.'}
      </Text>
      <Text style={estilos.etiqueta}>Correo electrónico</Text>
      <TextInput
        style={estilos.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        accessibilityLabel="Correo electrónico"
      />
      <Text style={estilos.etiqueta}>Contraseña</Text>
      <TextInput
        style={estilos.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        accessibilityLabel="Contraseña"
      />
      <Boton
        titulo={procesando ? 'Procesando…' : modoRegistro ? 'Crear cuenta' : 'Iniciar sesión'}
        deshabilitado={procesando || !email.trim() || password.length < 8}
        onPress={enviar}
      />
      <Boton
        titulo={modoRegistro ? 'Ya tengo cuenta' : 'Crear una cuenta'}
        color={colores.textoSuave}
        onPress={() => setModoRegistro((v) => !v)}
      />
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  carga: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colores.fondo,
  },
  pantalla: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 14,
    backgroundColor: colores.fondo,
  },
  titulo: { fontSize: 30, fontWeight: '800', color: colores.texto, textAlign: 'center' },
  texto: { fontSize: tamanos.texto, color: colores.textoSuave, textAlign: 'center' },
  etiqueta: { fontSize: tamanos.texto, fontWeight: '700', color: colores.texto },
  input: {
    backgroundColor: colores.superficie,
    borderWidth: 1.5,
    borderColor: colores.borde,
    borderRadius: 12,
    padding: 14,
    fontSize: tamanos.texto,
  },
});
