/** Lectura de ruta.geojson (A4) e interpolación visual del sendero para el simulador. */
import type { Estacion } from '../dominio/modelo';

export interface PosicionEstacion {
  lat: number;
  lon: number;
  aproximada: boolean;
  /** true cuando se interpola entre dos paradas vecinas con posición OSM para mostrar en el simulador. */
  interpolada?: boolean;
}

export interface PuntoReferencia {
  id: string;
  nombre: string;
  lat: number;
  lon: number;
}

export interface PuntoEstacionMapa {
  id: string;
  orden: number;
  nombre: string;
  lat: number | null;
  lon: number | null;
  aproximada: boolean;
  interpolada: boolean;
}

interface GeoFeature {
  type?: string;
  properties?: Record<string, unknown> | null;
  geometry?: { type?: string; coordinates?: unknown } | null;
}

export function estacionesDeRuta(geo: unknown): Record<string, PosicionEstacion> {
  const salida: Record<string, PosicionEstacion> = {};
  const features = (geo as { features?: GeoFeature[] } | null)?.features;
  if (!Array.isArray(features)) return salida;
  for (const f of features) {
    const id = f.properties?.estacionId;
    const c = f.geometry?.coordinates;
    if (f.geometry?.type !== 'Point' || typeof id !== 'string' || !Array.isArray(c)) continue;
    const [lon, lat] = c as number[];
    if (typeof lat !== 'number' || typeof lon !== 'number') continue;
    salida[id] = { lat, lon, aproximada: f.properties?.aproximada !== false };
  }
  return salida;
}

export function referenciasDeRuta(geo: unknown): PuntoReferencia[] {
  const salida: PuntoReferencia[] = [];
  const features = (geo as { features?: GeoFeature[] } | null)?.features;
  if (!Array.isArray(features)) return salida;
  for (const f of features) {
    if (f.geometry?.type !== 'Point' || f.properties?.tipo !== 'referencia') continue;
    const c = f.geometry.coordinates;
    const nombre = f.properties?.nombre;
    const id = f.properties?.id;
    if (!Array.isArray(c) || typeof nombre !== 'string') continue;
    const [lon, lat] = c as number[];
    if (typeof lat !== 'number' || typeof lon !== 'number') continue;
    salida.push({ id: typeof id === 'string' ? id : nombre, nombre, lat, lon });
  }
  return salida;
}

/**
 * Construye los puntos de las estaciones ordenadas para el mapa/simulador.
 * Si una estación intermedia (como Aguacerales o Lunares) aún no tiene punto en OSM,
 * interpola visualmente entre la parada anterior y la siguiente conocidas sin tocar `Estacion.ubicacion`.
 */
export function puntosSenderoMapa(
  estaciones: Estacion[],
  desdeRuta: Record<string, PosicionEstacion>
): PuntoEstacionMapa[] {
  const base: PuntoEstacionMapa[] = [...estaciones]
    .sort((a, b) => a.orden - b.orden)
    .map((e) => {
      if (e.ubicacion) {
        return {
          id: e.id,
          orden: e.orden,
          nombre: e.nombre,
          lat: e.ubicacion.lat,
          lon: e.ubicacion.lon,
          aproximada: false,
          interpolada: false,
        };
      }
      const aprox = desdeRuta[e.id];
      if (aprox) {
        return {
          id: e.id,
          orden: e.orden,
          nombre: e.nombre,
          lat: aprox.lat,
          lon: aprox.lon,
          aproximada: aprox.aproximada,
          interpolada: false,
        };
      }
      return {
        id: e.id,
        orden: e.orden,
        nombre: e.nombre,
        lat: null,
        lon: null,
        aproximada: true,
        interpolada: false,
      };
    });

  // Interpola linealmente paradas intermedias entre dos paradas conocidas del recorrido.
  for (let i = 0; i < base.length; i++) {
    if (base[i].lat != null && base[i].lon != null) continue;
    let prev = i - 1;
    while (prev >= 0 && (base[prev].lat == null || base[prev].lon == null)) prev--;
    let sig = i + 1;
    while (sig < base.length && (base[sig].lat == null || base[sig].lon == null)) sig++;
    if (prev >= 0 && sig < base.length) {
      const t = (i - prev) / (sig - prev);
      base[i] = {
        ...base[i],
        lat: base[prev].lat! + (base[sig].lat! - base[prev].lat!) * t,
        lon: base[prev].lon! + (base[sig].lon! - base[prev].lon!) * t,
        aproximada: true,
        interpolada: true,
      };
    }
  }

  return base;
}
