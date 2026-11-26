/**
 * Carga offline del paquete oficial del guion (`contenido.json`) y del catálogo semilla
 * de biodiversidad (`catalogo.json`), empaquetados dentro del APK por Dev A.
 */
import catalogoJson from '../../assets/catalogo.json';
import contenidoJson from '../../assets/contenido.json';
import type {
  EspecieCatalogo,
  Estacion,
  Fragmento,
  Guion,
  PaqueteContenido,
  RepositorioContenido,
} from '../dominio/modelo';

export function cargarPaquete(): PaqueteContenido {
  return contenidoJson as unknown as PaqueteContenido;
}

export function cargarCatalogo(): EspecieCatalogo[] {
  return catalogoJson as unknown as EspecieCatalogo[];
}

export function crearRepositorioContenido(
  paquete: PaqueteContenido = cargarPaquete()
): RepositorioContenido {
  const estacionesPorId = new Map<string, Estacion>(
    paquete.estaciones.map((e) => [e.id, e])
  );
  const guionesPorId = new Map<string, Guion>(
    paquete.guiones.map((g) => [g.id, g])
  );

  return {
    async cargar(): Promise<PaqueteContenido> {
      return paquete;
    },
    fragmentosActivos(): Fragmento[] {
      return paquete.fragmentos.filter((f) => f.apto);
    },
    estacion(id: string): Estacion | undefined {
      return estacionesPorId.get(id);
    },
    guion(id: string): Guion | undefined {
      return guionesPorId.get(id);
    },
  };
}
