/** Lectura de ruta.geojson (A4): LineString opcional, Point por estación y hitos de referencia. */

export interface PosicionEstacion {
  lat: number;
  lon: number;
  aproximada: boolean;
}

export interface PuntoReferencia {
  id: string;
  nombre: string;
  lat: number;
  lon: number;
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
