// Hook PreToolUse: bloquea secretos y rutas fuera del proyecto; pide permiso para acciones sensibles.
// Exit 2 = bloquear (el mensaje de stderr se le muestra a Claude).
import { resolve, relative, isAbsolute, basename, extname } from 'node:path';

let entrada = '';
for await (const trozo of process.stdin) entrada += trozo;
const datos = JSON.parse(entrada || '{}');
const raiz = resolve(process.env.CLAUDE_PROJECT_DIR || datos.cwd || process.cwd());
const args = datos.tool_input || {};

const esSecreto = (ruta) => {
  const n = basename(ruta);
  return (
    (/^\.env/.test(n) && n !== '.env.example') ||
    ['.pem', '.key', '.jks', '.keystore', '.p12', '.p8'].includes(extname(n)) ||
    /^serviceAccount.*\.json$/.test(n) ||
    n === 'google-services.json'
  );
};
const bloquear = (m) => {
  console.error(`Bloqueado por la configuración de IA: ${m}`);
  process.exit(2);
};
const preguntar = (m) => {
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'ask',
        permissionDecisionReason: m,
      },
    }),
  );
  process.exit(0);
};

for (const campo of ['file_path', 'path', 'notebook_path']) {
  const v = args[campo];
  if (typeof v !== 'string' || !v) continue;
  const abs = resolve(raiz, v);
  const rel = relative(raiz, abs);
  if (rel.startsWith('..') || isAbsolute(rel)) bloquear(`ruta fuera del repositorio (${v})`);
  if (esSecreto(abs)) bloquear(`archivo sensible (${basename(abs)})`);
}

if (datos.tool_name === 'Bash' && typeof args.command === 'string') {
  const c = args.command;
  if (/\.env(\.|\b)(?!example)/.test(c) || /\.(pem|key|jks|keystore)\b/.test(c))
    bloquear('el comando toca archivos sensibles');
  if (/(^|[\s;&|])\.\.\//.test(c) || /(^|\s)(~|\/(etc|home|root|mnt))\b/.test(c))
    bloquear('el comando apunta fuera del repositorio');
  if (/\bgit\s+push\b|\beas\b|\bvercel\b/.test(c))
    preguntar('acción con efecto fuera de la máquina');
}
process.exit(0);
