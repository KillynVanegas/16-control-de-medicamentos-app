import { Pressable, StyleSheet, Text } from 'react-native';
import { colores, tamanos } from '@/theme';

interface Props {
  titulo: string;
  accessibilityLabel?: string;
  onPress: () => void;
  color?: string;
  deshabilitado?: boolean;
  flex?: boolean;
}

export function Boton({
  titulo,
  accessibilityLabel,
  onPress,
  color = colores.primario,
  deshabilitado,
  flex,
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? titulo}
      accessibilityState={{ disabled: !!deshabilitado }}
      disabled={deshabilitado}
      onPress={onPress}
      style={({ pressed }) => [
        estilos.boton,
        { backgroundColor: deshabilitado ? colores.borde : color, opacity: pressed ? 0.85 : 1 },
        flex && { flex: 1 },
      ]}
    >
      <Text style={estilos.texto}>{titulo}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  boton: {
    minHeight: tamanos.boton,
    borderRadius: 12,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  texto: { color: '#fff', fontSize: tamanos.texto, fontWeight: '700', textAlign: 'center' },
});
