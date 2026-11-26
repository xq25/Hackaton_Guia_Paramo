/** Lectura de ruta.geojson (A4): LineString de la ruta + Point por estación { estacionId, aproximada }. */

export interface PosicionEstacion {
  lat: number;
  lon: number;
  aproximada: boolean;
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
