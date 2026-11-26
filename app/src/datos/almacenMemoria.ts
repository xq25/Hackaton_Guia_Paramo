import type { Almacen } from '../dominio/modelo';

/** Almacén en memoria para pruebas (no persiste, no usa módulos nativos). */
export function crearAlmacenMemoria(): Almacen {
  const datos = new Map<string, string>();
  return {
    leer: (clave) => datos.get(clave),
    escribir: (clave, valor) => {
      datos.set(clave, valor);
    },
    borrar: (clave) => {
      datos.delete(clave);
    },
  };
}
