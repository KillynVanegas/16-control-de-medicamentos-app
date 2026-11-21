import { Directory, File, Paths } from 'expo-file-system';
import { nuevoUuid } from '@/domain/uuid';

const DIRECTORIO_FOTOS = 'fotos-medicamentos';

export async function guardarFotoLocal(uri: string, extension: string): Promise<string> {
  const directorio = new Directory(Paths.document, DIRECTORIO_FOTOS);
  directorio.create({ idempotent: true, intermediates: true });

  const extensionSegura = /^[a-z0-9]{1,8}$/i.test(extension) ? extension.toLowerCase() : 'jpg';
  const destino = new File(directorio, `${nuevoUuid()}.${extensionSegura}`);
  new File(uri).copy(destino);
  return destino.uri;
}
