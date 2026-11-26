/** Lógica del editor de fichas (B7), sin React. */
import { EstadoFicha, Naturaleza, Tema, TipoRespuesta, type Fragmento, type PaqueteContenido } from '../../../dominio/modelo';
import contenidoMini from '../../../asistente/__tests__/fixtures/contenido-mini.json';
import {
  ESTADOS, TEMAS, TIPOS, TIPOS_RESPUESTA, erroresPorCampo, fichaNueva, filtrarFragmentos, generarId,
  leerPagina, nombreArchivoExportacion,
} from '../logica';

const paquete = contenidoMini as unknown as PaqueteContenido;
const frag = (id: string) => paquete.fragmentos.find(f => f.id === id) as Fragmento;

describe('fichaNueva', () => {
  test('vacía: borrador sin fuente ni reemplazos', () => {
    const f = fichaNueva();
    expect(f).toMatchObject({ titulo: '', texto: '', estado: EstadoFicha.BORRADOR, estacionId: null, reemplazaFragmentoIds: [] });
    expect(f.fuente).toEqual({ documento: '' });
    expect(f.id).toMatch(/^ficha-/);
  });

  test('desde un fragmento del guion: lo prellena y lo reemplaza', () => {
    const f = fichaNueva(frag('uton2024-p7-dc4'));
    expect(f).toMatchObject({
      titulo: 'No intervenir las dunas', estacionId: 'arenales', naturaleza: Naturaleza.NORMA,
      fuente: { guionId: 'uton2024', pagina: 7 }, reemplazaFragmentoIds: ['uton2024-p7-dc4'],
    });
  });
});

describe('filtrarFragmentos', () => {
  test('sin tildes ni mayúsculas, todas las palabras', () => {
    const r = filtrarFragmentos(paquete.fragmentos, 'FRAILEJON necromasa', 'todas');
    expect(r.map(f => f.id)).toEqual(['uton2024-p5-3']);
  });

  test('por estación y "todo el recorrido"', () => {
    expect(filtrarFragmentos(paquete.fragmentos, '', 'lunares').every(f => f.estacionId === 'lunares')).toBe(true);
    expect(filtrarFragmentos(paquete.fragmentos, 'kumanday', null).map(f => f.id).sort())
      .toEqual(['uton2024-p34', 'zona_norte-p1']);
  });

  test('busca también en palabras clave', () => {
    expect(filtrarFragmentos(paquete.fragmentos, 'cacho de venado', 'todas').map(f => f.id)).toContain('uton2024-p9');
  });
});

describe('erroresPorCampo', () => {
  test('cada mensaje de validar() va junto a su campo', () => {
    expect(erroresPorCampo([
      'Falta el título.', 'Falta el texto.', 'La estación elegida no existe.',
      'El contenido de salud de altura no se puede editar desde aquí.', 'Elige el tipo de contenido.',
      'Indica la página o el documento de donde sale.', 'La página debe estar entre 1 y 57.',
      'Indica quién revisó la ficha (cargo).', 'El fragmento que quieres reemplazar no existe: x.',
    ])).toEqual({
      titulo: ['Falta el título.'],
      texto: ['Falta el texto.'],
      estacionId: ['La estación elegida no existe.'],
      tema: ['El contenido de salud de altura no se puede editar desde aquí.'],
      naturaleza: ['Elige el tipo de contenido.'],
      fuente: ['Indica la página o el documento de donde sale.', 'La página debe estar entre 1 y 57.'],
      aprobadaPor: ['Indica quién revisó la ficha (cargo).'],
      general: ['El fragmento que quieres reemplazar no existe: x.'],
    });
  });
});

describe('textos en lenguaje llano', () => {
  test('salud de altura no aparece entre los temas editables', () => {
    expect(TEMAS.map(t => t.valor)).not.toContain(Tema.SALUD_ALTURA);
  });

  test('hay etiqueta para cada tipo, estado y tipo de respuesta', () => {
    expect(TIPOS.map(t => t.valor).sort()).toEqual(Object.values(Naturaleza).sort());
    expect(Object.keys(ESTADOS).sort()).toEqual(Object.values(EstadoFicha).sort());
    expect(Object.keys(TIPOS_RESPUESTA).sort()).toEqual(Object.values(TipoRespuesta).sort());
  });
});

test('leerPagina', () => {
  expect(leerPagina(' 12 ')).toBe(12);
  expect(leerPagina('')).toBeUndefined();
  expect(leerPagina('doce')).toBeUndefined();
});

test('generarId no se repite', () => {
  const ids = new Set(Array.from({ length: 1000 }, () => generarId(0))); // mismo milisegundo
  expect(ids.size).toBe(1000);
});

test('nombre del archivo exportado', () => {
  expect(nombreArchivoExportacion('2026-11-26')).toBe('fichas-2026-11-26.json');
});
