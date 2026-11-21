import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { formatoFechaHora } from '@/domain/formato';
import type { TomaConMedicamento } from '@/domain/tipos';
import { adherenciaSemanal, historial } from '@/services/medicamentos';
import { colores, tamanos } from '@/theme';

export default function Historial() {
  const [tomas, setTomas] = useState<TomaConMedicamento[]>([]);
  const [adherencia, setAdherencia] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setTomas(await historial());
        setAdherencia(await adherenciaSemanal(new Date()));
      })();
    }, []),
  );

  return (
    <View style={estilos.pantalla}>
      <Text style={estilos.resumen}>
        Adherencia semanal: {adherencia == null ? 'sin datos' : `${adherencia} %`}
      </Text>
      <FlatList
        data={tomas}
        keyExtractor={(t) => String(t.id)}
        ListEmptyComponent={<Text style={estilos.vacio}>Todavía no hay tomas registradas.</Text>}
        renderItem={({ item }) => (
          <View
            style={estilos.fila}
            accessible
            accessibilityLabel={`${item.nombre}, ${item.estado}, ${formatoFechaHora(item.programada_para)}`}
          >
            <View style={{ flex: 1 }}>
              <Text style={estilos.nombre}>{item.nombre}</Text>
              <Text style={estilos.detalle}>{formatoFechaHora(item.programada_para)}</Text>
            </View>
            <Text
              style={[
                estilos.estado,
                { color: item.estado === 'tomada' ? colores.tomada : colores.omitida },
              ]}
            >
              {item.estado === 'tomada' ? 'Tomada' : 'Omitida'}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, padding: 16, backgroundColor: colores.fondo },
  resumen: { fontSize: tamanos.texto, fontWeight: '700', color: colores.texto, marginBottom: 12 },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colores.superficie,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  nombre: { fontSize: 20, fontWeight: '700', color: colores.texto },
  detalle: { fontSize: 16, color: colores.textoSuave },
  estado: { fontSize: tamanos.texto, fontWeight: '700' },
  vacio: { fontSize: tamanos.texto, color: colores.textoSuave },
});
