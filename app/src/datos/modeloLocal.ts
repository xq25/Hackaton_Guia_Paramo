/**
 * Verifica si el archivo .gguf del modelo local está copiado en el celular.
 * Si no existe aún (p. ej. al instalar el APK por descarga directa sin adb push),
 * provee un MotorModelo vacío inmediato para que el asistente responda en milisegundos
 * con los fragmentos oficiales del guion (RESPALDO_SIN_MODELO) sin bloquear ni invocar llama.rn.
 */
import { File } from 'expo-file-system';
import type { MotorModelo } from '../dominio/modelo';

export function existeArchivoModelo(rutaModelo: string): boolean {
  try {
    const uri = rutaModelo.startsWith('file://') ? rutaModelo : `file://${rutaModelo}`;
    const archivo = new File(uri);
    return Boolean(archivo.exists && (archivo.size ?? 0) > 1024);
  } catch {
    return false;
  }
}

export const motorSinArchivoLocal: MotorModelo = {
  async cargar(): Promise<void> {
    // Sin modelo .gguf en almacenamiento local: se usa respuesta directa del guion.
  },
  async generar(): Promise<string> {
    throw new Error('Modelo .gguf no instalado en el dispositivo');
  },
  estaListo(): boolean {
    return false;
  },
  async liberar(): Promise<void> {},
};
