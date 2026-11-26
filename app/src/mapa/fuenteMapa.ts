/**
 * Ubica los archivos del mapa en el celular y lee rangos del .pmtiles para el WebView.
 * El WebView no siempre puede leer rangos de file://, así que los bytes pasan por postMessage
 * (riesgo anotado en doc 01).
 */
import { Asset } from 'expo-asset';
import { File, Paths, type FileHandle } from 'expo-file-system';
import { RUTA_GEOJSON, ZONA_PMTILES } from './recursosMapa';

/** Archivo de prueba local (no se commitea). Se copia con:
 *  adb push zona.prueba.pmtiles /sdcard/Android/data/co.uton.paramon/files/pruebas-locales/  */
const NOMBRE_PRUEBA = 'zona.prueba.pmtiles';

async function archivoDeAsset(modulo: number): Promise<File | null> {
  const asset = Asset.fromModule(modulo);
  await asset.downloadAsync();
  return asset.localUri ? new File(asset.localUri) : null;
}

/** Devuelve el .pmtiles a usar o null si no hay (el mapa se muestra sin fondo). */
export async function ubicarPmtiles(): Promise<File | null> {
  try {
    if (ZONA_PMTILES != null) return await archivoDeAsset(ZONA_PMTILES);
    const candidatos = [
      new File(Paths.document, 'pruebas-locales', NOMBRE_PRUEBA),
      new File(Paths.cache, 'pruebas-locales', NOMBRE_PRUEBA),
    ];
    return candidatos.find((f) => f.exists) ?? null;
  } catch {
    return null;
  }
}

/** Lee ruta.geojson de A; null si aún no existe (antes de S6). */
export async function cargarRuta(): Promise<unknown | null> {
  try {
    if (RUTA_GEOJSON == null) return null;
    const archivo = await archivoDeAsset(RUTA_GEOJSON);
    return archivo ? JSON.parse(await archivo.text()) : null;
  } catch {
    return null;
  }
}

/** Lector de rangos con un solo FileHandle; las lecturas se encadenan porque comparten offset. */
export function crearLectorRangos(archivo: File) {
  let handle: FileHandle | null = null;
  let cola: Promise<unknown> = Promise.resolve();

  const leer = (offset: number, length: number): Promise<Uint8Array> => {
    const tarea = cola.then(async () => {
      if (!handle) handle = archivo.open();
      handle.offset = offset;
      return handle.readBytes(length);
    });
    cola = tarea.catch(() => undefined);
    return tarea;
  };

  const cerrar = () => {
    try {
      handle?.close();
    } catch {
      // ya cerrado
    }
    handle = null;
  };

  return { leer, cerrar };
}
