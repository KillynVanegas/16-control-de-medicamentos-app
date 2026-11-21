import { Tabs } from 'expo-router';
import { colores } from '@/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colores.primario,
        tabBarLabelStyle: { fontSize: 15, fontWeight: '600' },
        tabBarStyle: { height: 64, paddingBottom: 8 },
        tabBarIconStyle: { display: 'none' },
        headerTitleStyle: { fontSize: 22 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Hoy' }} />
      <Tabs.Screen name="medicamentos" options={{ title: 'Medicamentos' }} />
      <Tabs.Screen name="historial" options={{ title: 'Historial' }} />
    </Tabs>
  );
}
