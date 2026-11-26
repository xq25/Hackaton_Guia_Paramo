/**
 * Almacén clave-valor de la app (MMKV), anónimo y local.
 * Se inyecta en crearAsistente (B, prefijo 'fichas.') y crearGestorProgreso (A, prefijo 'progreso.').
 * C usa el prefijo 'config.'.
 */
import { createMMKV } from 'react-native-mmkv';
import type { Almacen } from '../dominio/modelo';

/** Adapta cualquier objeto con la forma de MMKV a la interfaz Almacen. */
export function crearAlmacen(mmkv: {
  getString(clave: string): string | undefined;
  set(clave: string, valor: string): void;
  remove(clave: string): boolean | void;
}): Almacen {
  return {
    leer: (clave) => mmkv.getString(clave),
    escribir: (clave, valor) => mmkv.set(clave, valor),
    borrar: (clave) => {
      mmkv.remove(clave);
    },
  };
}

/** Instancia única para toda la app. */
export const almacen: Almacen = crearAlmacen(createMMKV({ id: 'paramon' }));
