import { useEffect, useRef } from 'react';
import { Accelerometer } from 'expo-sensors';
import { esSacudida } from '@/domain/shake';

/** Llama a `onShake` al sacudir el teléfono. No hace nada si el sensor no existe. */
export function useShake(onShake: () => void, activo: boolean) {
  const callback = useRef(onShake);
  callback.current = onShake;

  useEffect(() => {
    if (!activo) return;
    let cancelado = false;
    let sub: { remove: () => void } | null = null;
    (async () => {
      try {
        if (!(await Accelerometer.isAvailableAsync()) || cancelado) return;
        Accelerometer.setUpdateInterval(100);
        let ultimo = 0;
        sub = Accelerometer.addListener(({ x, y, z }) => {
          const ahora = Date.now();
          if (esSacudida(x, y, z) && ahora - ultimo > 1000) {
            ultimo = ahora;
            callback.current();
          }
        });
      } catch {
        // sin sensor: queda el botón «Silenciar»
      }
    })();
    return () => {
      cancelado = true;
      sub?.remove();
    };
  }, [activo]);
}
