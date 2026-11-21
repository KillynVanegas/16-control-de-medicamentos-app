// Detección simple de secretos en archivos del proyecto (sin dependencias).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const IGNORAR = new Set(['node_modules', '.git', '.expo', 'dist', 'ios', 'android']);
const EXT = new Set(['.ts', '.tsx', '.js', '.mjs', '.json', '.env', '']);
const PATRONES = [
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'clave privada'],
  [/AIza[0-9A-Za-z_-]{35}/, 'clave de API de Google/Firebase'],
  [/firebaseConfig/, 'firebaseConfig (la app no debe incluirlo)'],
  [/BLOB_READ_WRITE_TOKEN\s*=\s*\S+/, 'token de Vercel Blob'],
  [/EXPO_PUBLIC_\w*(KEY|SECRET|TOKEN|PRIVATE|PASSWORD)\w*/i, 'secreto en variable EXPO_PUBLIC_'],
];

const hallazgos = [];
function recorrer(dir) {
  for (const nombre of readdirSync(dir)) {
    if (IGNORAR.has(nombre)) continue;
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) recorrer(ruta);
    else if (
      EXT.has(extname(nombre)) &&
      nombre !== 'check-secrets.mjs' &&
      nombre !== '.env.example'
    ) {
      const texto = readFileSync(ruta, 'utf8');
      for (const [re, desc] of PATRONES) if (re.test(texto)) hallazgos.push(`${ruta}: ${desc}`);
    }
  }
}
recorrer('.');
if (hallazgos.length) {
  console.error('Posibles secretos encontrados:\n' + hallazgos.join('\n'));
  process.exit(1);
}
console.log('Sin secretos detectados.');
