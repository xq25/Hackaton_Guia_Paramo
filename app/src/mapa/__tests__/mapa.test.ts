import { ESTACIONES } from '../../dominio/modelo';
import { bytesABase64 } from '../base64';
import { estacionesDeRuta, puntosSenderoMapa, referenciasDeRuta } from '../ruta';

function decodificarBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

describe('bytesABase64', () => {
  it('es invertible con atob para varios tamaños', () => {
    for (const n of [0, 1, 2, 3, 4, 5, 100, 12289, 40000]) {
      const b = new Uint8Array(n);
      for (let i = 0; i < n; i++) b[i] = (i * 37 + 11) & 255;
      expect(Array.from(decodificarBase64(bytesABase64(b)))).toEqual(Array.from(b));
    }
  });
});

describe('estacionesDeRuta, referenciasDeRuta y puntosSenderoMapa', () => {
  it('interpola paradas intermedias sin coordenadas OSM sin tocar Estacion.ubicacion', () => {
    const geo = {
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', properties: { estacionId: 'brisas', aproximada: true }, geometry: { type: 'Point', coordinates: [-75.35, 4.93] } },
        { type: 'Feature', properties: { estacionId: 'arenales', aproximada: true }, geometry: { type: 'Point', coordinates: [-75.354, 4.919] } },
        { type: 'Feature', properties: { estacionId: 'valle_tumbas', aproximada: true }, geometry: { type: 'Point', coordinates: [-75.356, 4.911] } },
        { type: 'Feature', properties: { tipo: 'referencia', id: 'crater_arenas', nombre: 'Cráter Arenas' }, geometry: { type: 'Point', coordinates: [-75.31, 4.88] } },
      ],
    };
    const desdeRuta = estacionesDeRuta(geo);
    const sendero = puntosSenderoMapa(ESTACIONES, desdeRuta);

    expect(sendero).toHaveLength(5);
    expect(sendero.every((p) => p.lat != null && p.lon != null)).toBe(true);
    expect(sendero.find((p) => p.id === 'aguacerales')?.interpolada).toBe(true);
    expect(sendero.find((p) => p.id === 'lunares')?.interpolada).toBe(true);
    expect(sendero.find((p) => p.id === 'brisas')?.interpolada).toBe(false);
    // Verifica que las entidades originales siguen con ubicacion: null (regla 8)
    expect(ESTACIONES.every((e) => e.ubicacion === null)).toBe(true);
    expect(referenciasDeRuta(geo)).toHaveLength(1);
  });
});
