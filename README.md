# 16 · Control de medicamentos — App móvil

Pastillero digital: horarios, recordatorios, confirmación de toma por deslizamiento y datos protegidos con biometría.
Repositorio hermano: `16-control-de-medicamentos-api` (Fase 3, aún no creado).

## Estado

| Fase                                              | Estado                                                 |
| ------------------------------------------------- | ------------------------------------------------------ |
| 0 Configuración de IA                             | Creada; **pruebas P01–P09 pendientes** (`ia/pruebas/`) |
| 1 Interfaz, gestos, sensores                      | Implementada, **sin probar en dispositivo**            |
| 2 SQLite local                                    | Implementada, **sin probar en dispositivo**            |
| 3–4 API, login, sincronización, 2.º sensor extra  | Pendiente                                              |
| RF-05 Foto del empaque (cámara/galería, pellizco) | Implementada                                           |

## Puesta en marcha

```bash
npm install
npx expo install --fix      # alinea las versiones con tu SDK de Expo
cp .env.example .env        # solo EXPO_PUBLIC_API_URL (no es secreto)
npm run check               # tipos, lint, formato, pruebas, secretos
npx expo start              # probar en un dispositivo físico
```

Para notificaciones y biometría use un development build (`expo-dev-client`) o un dispositivo físico; Expo Go tiene límites.

## Qué hace

- Bloqueo con huella/rostro o bloqueo del sistema; se vuelve a bloquear al pasar a segundo plano.
- Tomas de hoy generadas por frecuencia; deslizar → tomada/omitida, pulsación larga → posponer, siempre con botón alternativo.
- Recordatorios locales (diarios si la frecuencia divide 24 h; si no, fechas de los próximos 7 días, renovadas al abrir la app) con acción «Posponer 10 min».
- Sensor: sacudir silencia la alarma (botón «Silenciar» como alternativa). Háptico al registrar.
- Adherencia semanal, historial, búsqueda por nombre, funcionamiento sin conexión.
- Foto del empaque: tomar una foto, elegirla de la galería o ampliar el pellizco al editar/crear.

## Decisiones a confirmar

1. La tabla `medicamento` usa `id INTEGER` (según el documento); para sincronizar con UUID habrá que migrarla en la Fase 4.
2. Si el teléfono no tiene ningún bloqueo de pantalla, la app avisa y permite entrar.
3. `android.package` / `bundleIdentifier` son de ejemplo: cámbielos antes de generar el APK.
