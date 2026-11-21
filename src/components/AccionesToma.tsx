import { StyleSheet, View } from 'react-native';
import { colores } from '@/theme';
import { Boton } from './Boton';

interface Props {
  nombre: string;
  habilitado: boolean;
  onTomada: () => void;
  onOmitida: () => void;
  onPosponer: () => void;
}

/** Alternativa por botones a los gestos (accesibilidad). */
export function AccionesToma({ nombre, habilitado, onTomada, onOmitida, onPosponer }: Props) {
  return (
    <View style={estilos.fila}>
      <Boton
        titulo="Tomada"
        accessibilityLabel={`Marcar ${nombre} como tomada`}
        color={colores.tomada}
        deshabilitado={!habilitado}
        onPress={onTomada}
        flex
      />
      <Boton
        titulo="Omitir"
        accessibilityLabel={`Omitir la toma de ${nombre}`}
        color={colores.omitida}
        deshabilitado={!habilitado}
        onPress={onOmitida}
        flex
      />
      <Boton
        titulo="+10 min"
        accessibilityLabel={`Posponer ${nombre} 10 minutos`}
        deshabilitado={!habilitado}
        onPress={onPosponer}
        flex
      />
    </View>
  );
}

const estilos = StyleSheet.create({ fila: { flexDirection: 'row', gap: 8, marginTop: 10 } });
