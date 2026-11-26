/**
 * Gestión del modelo local .gguf para llama.rn ("Preparar salida", docs/01 y CLAUDE.md):
 * - Busca el modelo tanto en el almacenamiento interno de la app (`Paths.document/modelos/modelo.gguf`,
 *   accesible en Android 11-15 sin restricciones de Android/data) como en la ruta `adb push` de CONFIG.
 * - Permite descargarlo con barra de progreso antes de activar Modo Avión (Qwen 3.5 0.8B o Gemma 4 E2B),
 *   o seleccionarlo desde la carpeta Descargas del celular con el selector nativo de Android.
 */
import { Directory, File, Paths } from 'expo-file-system';
import { createDownloadResumable, type DownloadResumable } from 'expo-file-system/legacy';
import type { MotorModelo } from '../dominio/modelo';

export interface OpcionModeloDescarga {
  id: 'qwen' | 'gemma';
  nombre: string;
  descripcion: string;
  tamanoAproxMb: number;
  url: string;
}

export const MODELOS_DESCARGA: OpcionModeloDescarga[] = [
  {
    id: 'qwen',
    nombre: 'Qwen 3.5 0.8B (Q4_K_M)',
    descripcion: '508 MB · Rápido y ligero (funciona en casi cualquier celular arm64)',
    tamanoAproxMb: 508,
    url: 'https://huggingface.co/unsloth/Qwen3.5-0.8B-GGUF/resolve/main/Qwen3.5-0.8B-Q4_K_M.gguf',
  },
  {
    id: 'gemma',
    nombre: 'Gemma 4 E2B (Q4_0 oficial)',
    descripcion: '2.7 GB · Mayor capacidad de redacción (requiere celular con 6+ GB de RAM)',
    tamanoAproxMb: 2710,
    url: 'https://huggingface.co/ggml-org/gemma-4-E2B-it-GGUF/resolve/main/gemma-4-E2B-it-Q4_0.gguf',
  },
];

export interface EstadoArchivoModelo {
  disponible: boolean;
  rutaEfectiva: string;
  tamanoMb: number | null;
}

export interface ProgresoDescargaModelo {
  escritosMb: number;
  totalMb: number | null;
  fraccion: number; // 0..1
}

function archivoInternoModelo(): File {
  return new File(Paths.document, 'modelos', 'modelo.gguf');
}

function directorioInternoModelos(): Directory {
  return new Directory(Paths.document, 'modelos');
}

export function resolverRutaModeloActiva(rutaConfigurada: string): EstadoArchivoModelo {
  // 1. Primero revisa el almacenamiento interno de la app (descargado o elegido en Ajustes)
  try {
    const interno = archivoInternoModelo();
    if (interno.exists && (interno.size ?? 0) > 1024 * 1024) {
      return {
        disponible: true,
        rutaEfectiva: interno.uri.replace(/^file:\/\//, ''),
        tamanoMb: Math.round((interno.size ?? 0) / (1024 * 1024)),
      };
    }
  } catch {
    // Entorno de pruebas sin módulo nativo
  }

  // 2. Luego revisa la ruta externa configurada (adb push /sdcard/Android/data/...)
  try {
    const uri = rutaConfigurada.startsWith('file://')
      ? rutaConfigurada
      : `file://${rutaConfigurada}`;
    const externo = new File(uri);
    if (externo.exists && (externo.size ?? 0) > 1024 * 1024) {
      return {
        disponible: true,
        rutaEfectiva: rutaConfigurada,
        tamanoMb: Math.round((externo.size ?? 0) / (1024 * 1024)),
      };
    }
  } catch {
    // Entorno de pruebas sin módulo nativo
  }

  return {
    disponible: false,
    rutaEfectiva: rutaConfigurada,
    tamanoMb: null,
  };
}

export function existeArchivoModelo(rutaConfigurada: string): boolean {
  return resolverRutaModeloActiva(rutaConfigurada).disponible;
}

let tareaDescargaActiva: DownloadResumable | null = null;

export async function descargarModeloLocal(
  url: string,
  alProgreso: (p: ProgresoDescargaModelo) => void
): Promise<void> {
  const dir = directorioInternoModelos();
  dir.create({ intermediates: true, idempotent: true });

  const temporal = new File(dir, 'modelo.gguf.part');
  const destino = archivoInternoModelo();
  if (temporal.exists) temporal.delete();

  const tarea = createDownloadResumable(url, temporal.uri, {}, (datos) => {
    const escritosMb = Math.round(datos.totalBytesWritten / (1024 * 1024));
    const totalMb =
      datos.totalBytesExpectedToWrite > 0
        ? Math.round(datos.totalBytesExpectedToWrite / (1024 * 1024))
        : null;
    const fraccion =
      datos.totalBytesExpectedToWrite > 0
        ? Math.min(1, datos.totalBytesWritten / datos.totalBytesExpectedToWrite)
        : 0;
    alProgreso({ escritosMb, totalMb, fraccion });
  });

  tareaDescargaActiva = tarea;
  try {
    const res = await tarea.downloadAsync();
    if (!res || (res.status && res.status >= 400)) {
      throw new Error(`No se pudo descargar el modelo (HTTP ${res?.status ?? 'error'}).`);
    }
    if (!temporal.exists || (temporal.size ?? 0) < 1024 * 1024) {
      throw new Error('La descarga se interrumpió antes de completarse.');
    }
    if (destino.exists) destino.delete();
    // En expo-file-system 58 move() y copy() son asíncronas: sin await la app busca el archivo antes de que exista.
    await temporal.move(destino);
  } finally {
    tareaDescargaActiva = null;
  }
}

export async function cancelarDescargaModelo(): Promise<void> {
  const activa = tareaDescargaActiva;
  tareaDescargaActiva = null;
  if (activa) {
    try {
      await activa.pauseAsync();
    } catch {
      // Ya cancelada
    }
  }
  try {
    const temporal = new File(directorioInternoModelos(), 'modelo.gguf.part');
    if (temporal.exists) temporal.delete();
  } catch {
    // Ignorar limpieza
  }
}

/** Abre el selector nativo de archivos de Android para copiar un .gguf desde Descargas/. */
export async function importarModeloDesdeCelular(): Promise<boolean> {
  const seleccion = await File.pickFileAsync({ multipleFiles: false });
  if (seleccion.canceled || !seleccion.result) return false;

  const origen = seleccion.result;
  const dir = directorioInternoModelos();
  dir.create({ intermediates: true, idempotent: true });

  const destino = archivoInternoModelo();
  if (destino.exists) destino.delete();
  await origen.copy(destino);
  return true;
}

export function borrarModeloInterno(): void {
  try {
    const destino = archivoInternoModelo();
    if (destino.exists) destino.delete();
  } catch {
    // Ignorar si no existe
  }
}

export const motorSinArchivoLocal: MotorModelo = {
  async cargar(): Promise<void> {},
  async generar(): Promise<string> {
    throw new Error('Modelo .gguf no instalado en el dispositivo');
  },
  estaListo(): boolean {
    return false;
  },
  async liberar(): Promise<void> {},
};
