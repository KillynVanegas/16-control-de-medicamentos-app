import { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Boton } from '@/components/Boton';
import type { Medicamento } from '@/domain/tipos';
import { eliminarMedicamento, listarMedicamentos } from '@/services/medicamentos';
import { buscarMedicamentos } from '@/repositories/medicamentos';
import { colores, tamanos } from '@/theme';

export default function Medicamentos() {
  const [lista, setLista] = useState<Medicamento[]>([]);
  const [busqueda, setBusqueda] = useState('');

  const cargar = useCallback(async (texto: string) => {
    setLista(texto.trim() ? await buscarMedicamentos(texto.trim()) : await listarMedicamentos());
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar(busqueda);
    }, [cargar, busqueda]),
  );

  function confirmarEliminar(m: Medicamento) {
    Alert.alert('Eliminar medicamento', `¿Eliminar ${m.nombre} y todas sus tomas?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await eliminarMedicamento(m.id);
          cargar(busqueda);
        },
      },
    ]);
  }

  return (
    <View style={estilos.pantalla}>
      <Boton titulo="Agregar medicamento" onPress={() => router.push('/medicamento/nuevo')} />
      <TextInput
        style={estilos.busqueda}
        placeholder="Buscar por nombre"
        accessibilityLabel="Buscar medicamento por nombre"
        value={busqueda}
        onChangeText={setBusqueda}
      />
      <FlatList
        data={lista}
        keyExtractor={(m) => String(m.id)}
        ListEmptyComponent={<Text style={estilos.vacio}>Aún no hay medicamentos.</Text>}
        renderItem={({ item }) => (
          <View style={estilos.tarjeta}>
            <Text style={estilos.nombre}>{item.nombre}</Text>
            <Text style={estilos.detalle}>
              {item.dosis} · cada {item.cada_horas} h{item.dias ? ` · ${item.dias} días` : ''}
            </Text>
            <View style={estilos.fila}>
              <Boton
                titulo="Editar"
                accessibilityLabel={`Editar ${item.nombre}`}
                flex
                onPress={() =>
                  router.push({ pathname: '/medicamento/nuevo', params: { id: String(item.id) } })
                }
              />
              <Boton
                titulo="Eliminar"
                accessibilityLabel={`Eliminar ${item.nombre}`}
                color={colores.alerta}
                flex
                onPress={() => confirmarEliminar(item)}
              />
            </View>
          </View>
        )}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, padding: 16, gap: 12, backgroundColor: colores.fondo },
  busqueda: {
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: 12,
    padding: 14,
    fontSize: tamanos.texto,
  },
  tarjeta: {
    backgroundColor: colores.superficie,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  nombre: { fontSize: 22, fontWeight: '700', color: colores.texto },
  detalle: { fontSize: tamanos.texto, color: colores.textoSuave, marginBottom: 10 },
  fila: { flexDirection: 'row', gap: 8 },
  vacio: { fontSize: tamanos.texto, color: colores.textoSuave },
});
