/** Búsqueda + evidencia + citas, sin modelo (B3). */
import { Nivel, type Evidencia, type PaqueteContenido } from '../../dominio/modelo';
import { advertencias, crearGeneradorCitas } from '../citas';
import { crearEvaluadorEvidencia } from '../evaluadorEvidencia';
import { crearFiltroSeguridad } from '../filtroSeguridad';
import { crearMotorBusqueda } from '../motorBusqueda';
import { crearNormalizador, vocabularioDominio } from '../normalizador';
import { REGLAS } from '../reglas';
import { CASOS } from './casos';
import contenidoMini from './fixtures/contenido-mini.json';

/** Mismo valor que config.ts (calibrado en B5 con contenido.json real). */
const UMBRAL = 3;
const MAX_FRAGMENTOS = 3;

const paquete = contenidoMini as unknown as PaqueteContenido;
const normalizador = crearNormalizador(paquete.sinonimos, vocabularioDominio(paquete));
const filtro = crearFiltroSeguridad(REGLAS, paquete);
const motor = crearMotorBusqueda(paquete.estaciones);
motor.indexar(paquete.fragmentos);
const evaluador = crearEvaluadorEvidencia(paquete);
const generador = crearGeneradorCitas(paquete);

function evidenciaDe(pregunta: string, estacionId: string | null): Evidencia {
  const consulta = normalizador.normalizar(pregunta, estacionId, Nivel.BREVE);
  return evaluador.evaluar(motor.buscar(consulta, MAX_FRAGMENTOS), UMBRAL);
}
const paginasCitadas = (e: Evidencia) => generador.citar(e).map(c => c.pagina).sort((a, b) => a - b);

describe('casos que responde el guion: página correcta y solo esa', () => {
  const respondibles = CASOS.filter(c => !c.esperado.motivo);

  test.each(respondibles)('$nombre', caso => {
    // ninguna regla de seguridad debe interceptarlos
    expect(filtro.evaluar(normalizador.normalizar(caso.pregunta, caso.estacionId, Nivel.BREVE))).toBeNull();
    const e = evidenciaDe(caso.pregunta, caso.estacionId);
    expect(e.suficiente).toBe(true);
    expect(paginasCitadas(e)).toEqual([...caso.esperado.paginas!].sort((a, b) => a - b));
  });
});

describe('los 4 casos de estación del jurado', () => {
  test('Aguacerales → UTON p. 5 (frailejón)', () => {
    const e = evidenciaDe('¿Qué papel cumple el frailejón?', 'aguacerales');
    expect(e.resultados[0].fragmento.id).toBe('uton2024-p5-3');
  });

  test('Arenales → UTON p. 7 (huellas que duran meses)', () => {
    const e = evidenciaDe('¿Por qué evitar pisar las dunas?', 'arenales');
    expect(e.resultados[0].fragmento.texto).toMatch(/huellas pueden perdurar meses/);
  });

  test('Lunares → UTON p. 8 con gelifracción Y oxidación', () => {
    const e = evidenciaDe('¿Qué explica las fracturas y qué el color?', 'lunares');
    expect(e.resultados.map(r => r.fragmento.id).sort()).toEqual(['uton2024-p8', 'uton2024-p8-2']);
  });

  test('Kumanday → diferencia con ambas fuentes y advertencia de tradición oral', () => {
    const e = evidenciaDe('¿De dónde viene Kumanday?', 'valle_tumbas');
    expect(e.diferencia?.id).toBe('kumanday-origen');
    expect(generador.citar(e).map(c => [c.guionTitulo, c.pagina])).toEqual([
      ['Guion turístico zona norte', 1],
      ['Guion Ecoturístico UTON 2024', 34],
    ]);
    expect(advertencias(e.resultados.map(r => r.fragmento))).toContain('Relato de tradición oral');
  });
});

describe('evidencia insuficiente', () => {
  test.each([
    ['¿Cuántas truchas hay en las quebradas?', 'aguacerales'],
    ['¿Qué come el cóndor?', null],
    ['¿Cuántos años tiene el universo?', null],
    ['¿Hay osos en el parque?', null],
    ['hola', 'lunares'],
    ['', null],
  ] as const)('%s', (pregunta, estacionId) => {
    const e = evidenciaDe(pregunta, estacionId);
    expect(e.suficiente).toBe(false);
    expect(generador.citar(e)).toEqual([]);
  });
});

describe('motor de búsqueda', () => {
  test('nunca devuelve fragmentos no aptos (salud de altura)', () => {
    const r = motor.buscar(normalizador.normalizar('mal agudo de montaña síntomas MAM', null, Nivel.BREVE), 10);
    expect(r.map(x => x.fragmento.apto)).not.toContain(false);
  });

  test('la estación nombrada gana a la palabra suelta ("Valle Lunar" ≠ "Valle de las Tumbas")', () => {
    const e = evidenciaDe('¿Por qué las piedras del Valle Lunar son rojas?', null);
    expect(e.resultados.every(r => r.fragmento.estacionId === 'lunares')).toBe(true);
  });

  test('reindexar reemplaza el índice anterior', () => {
    const m = crearMotorBusqueda(paquete.estaciones);
    m.indexar(paquete.fragmentos);
    m.indexar(paquete.fragmentos.filter(f => f.id !== 'uton2024-p5-3'));
    const r = m.buscar(normalizador.normalizar('frailejón necromasa', null, Nivel.BREVE), 5);
    expect(r.map(x => x.fragmento.id)).not.toContain('uton2024-p5-3');
  });

  test('tolera lista nula sin lanzar', () => {
    const m = crearMotorBusqueda();
    expect(() => m.indexar(null as never)).not.toThrow();
    expect(m.buscar(normalizador.normalizar('frailejón', null, Nivel.BREVE), 3)).toEqual([]);
  });
});

describe('citas y advertencias', () => {
  test('una cita por guion + página', () => {
    const e = evidenciaDe('¿Qué explica las fracturas y qué el color?', 'lunares');
    expect(generador.citar(e)).toEqual([
      { guionTitulo: 'Guion Ecoturístico UTON 2024', pagina: 8, estacionNombre: 'Lunares', naturaleza: 'cientifico' },
    ]);
  });

  test('dato fechado con fecha → "Dato de 1985"', () => {
    const f = paquete.fragmentos.find(x => x.id === 'uton2024-p10-4')!;
    expect(advertencias([f])).toEqual(['Dato de 1985']);
  });

  test('dato fechado sin fecha → aviso de que puede haber cambiado', () => {
    const f = paquete.fragmentos.find(x => x.id === 'zona_norte-p7')!;
    expect(advertencias([f])[0]).toMatch(/puede haber cambiado/);
  });

  test('sin advertencias repetidas', () => {
    const tradicion = paquete.fragmentos.filter(x => x.naturaleza === 'tradicion_oral');
    expect(advertencias(tradicion)).toEqual(['Relato de tradición oral']);
  });
});
