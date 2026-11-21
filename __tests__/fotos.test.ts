jest.mock('expo-file-system', () => {
  class MockDirectory {
    uri: string;
    create = jest.fn();

    constructor(...parts: Array<string | { uri: string }>) {
      this.uri = parts.map((part) => (typeof part === 'string' ? part : part.uri)).join('/');
    }
  }

  class MockFile {
    uri: string;
    copy = jest.fn();

    constructor(...parts: Array<string | { uri: string }>) {
      this.uri = parts.map((part) => (typeof part === 'string' ? part : part.uri)).join('/');
    }
  }

  return {
    Directory: jest.fn((...parts: Array<string | { uri: string }>) => new MockDirectory(...parts)),
    File: jest.fn((...parts: Array<string | { uri: string }>) => new MockFile(...parts)),
    Paths: { document: { uri: 'file:///documents' } },
  };
});

import { Paths } from 'expo-file-system';
import { guardarFotoLocal } from '@/services/fotos';

const fileSystemMock = jest.requireMock('expo-file-system') as {
  Directory: jest.Mock;
  File: jest.Mock;
  Paths: typeof Paths;
};

describe('guardarFotoLocal', () => {
  beforeEach(() => {
    fileSystemMock.Directory.mockClear();
    fileSystemMock.File.mockClear();
  });

  it('copia la foto seleccionada a documentos y devuelve la URI persistente', async () => {
    const uri = await guardarFotoLocal('file:///cache/foto.png', 'png');
    const directorio = fileSystemMock.Directory.mock.results[0]?.value;
    const archivoDestino = fileSystemMock.File.mock.results[0]?.value;
    const archivoOrigen = fileSystemMock.File.mock.results[1]?.value;

    expect(directorio.create).toHaveBeenCalledWith({ idempotent: true, intermediates: true });
    expect(archivoOrigen.copy).toHaveBeenCalledWith(archivoDestino);
    expect(archivoDestino.uri).toMatch(/^file:\/\/\/documents\/fotos-medicamentos\/.+\.png$/);
    expect(uri).toBe(archivoDestino.uri);
    expect(fileSystemMock.Directory).toHaveBeenCalledWith(Paths.document, 'fotos-medicamentos');
  });
});
