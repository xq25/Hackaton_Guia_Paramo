import { bytesABase64 } from '../base64';
import { estacionesDeRuta, referenciasDeRuta } from '../ruta';

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

describe('estacionesDeRuta y referenciasDeRuta', () => {
  it('toma los puntos con estacionId, respeta aproximada y separa hitos de referencia', () => {
    const geo = {
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [[-75.4, 4.9], [-75.3, 4.95]] } },
        { type: 'Feature', properties: { estacionId: 'brisas', aproximada: true }, geometry: { type: 'Point', coordinates: [-75.35, 4.9] } },
        { type: 'Feature', properties: { tipo: 'referencia', id: 'crater_arenas', nombre: 'Cráter Arenas' }, geometry: { type: 'Point', coordinates: [-75.31, 4.88] } },
      ],
    };
    expect(estacionesDeRuta(geo)).toEqual({ brisas: { lat: 4.9, lon: -75.35, aproximada: true } });
    expect(referenciasDeRuta(geo)).toEqual([{ id: 'crater_arenas', nombre: 'Cráter Arenas', lat: 4.88, lon: -75.31 }]);
    expect(estacionesDeRuta(null)).toEqual({});
  });
});
