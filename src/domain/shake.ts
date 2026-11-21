// Lógica pura de "sacudir": magnitud en g (en reposo ≈ 1).
export function esSacudida(x: number, y: number, z: number, umbral = 2.2): boolean {
  return Math.sqrt(x * x + y * y + z * z) > umbral;
}
