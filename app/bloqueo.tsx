import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSesion } from '@/auth/SesionProvider';
import { autenticar } from '@/auth/biometria';
import { Boton } from '@/components/Boton';
import { colores, tamanos } from '@/theme';

export default function Bloqueo() {
  const { setDesbloqueado } = useSesion();
  const [mensaje, setMensaje] = useState('Sus datos de salud están protegidos.');
  const [sinBloqueo, setSinBloqueo] = useState(false);

  const intentar = useCallback(async () => {
    const r = await autenticar();
    if (r === 'ok') setDesbloqueado(true);
    else if (r === 'sin_bloqueo') {
      setSinBloqueo(true);
      setMensaje(
        'Su teléfono no tiene bloqueo de pantalla. Actívelo en Ajustes para proteger sus datos.',
      );
    } else setMensaje('No se pudo verificar su identidad. Intente de nuevo.');
  }, [setDesbloqueado]);

  useEffect(() => {
    intentar();
  }, [intentar]);

  return (
    <View style={estilos.pantalla}>
      <Text style={estilos.titulo} accessibilityRole="header">
        Control de medicamentos
      </Text>
      <Text style={estilos.texto}>{mensaje}</Text>
      <Boton
        titulo="Desbloquear"
        accessibilityLabel="Desbloquear con huella, rostro o bloqueo del teléfono"
        onPress={intentar}
      />
      {sinBloqueo && (
        <Boton
          titulo="Entrar sin bloqueo"
          color={colores.omitida}
          onPress={() => setDesbloqueado(true)}
        />
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 16,
    backgroundColor: colores.fondo,
  },
  titulo: { fontSize: 30, fontWeight: '800', color: colores.texto },
  texto: { fontSize: tamanos.texto, color: colores.textoSuave },
});
