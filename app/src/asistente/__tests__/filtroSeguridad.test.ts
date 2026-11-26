/** Normalizador + filtro de seguridad, sin búsqueda ni modelo (B2). */
import { MotivoLimite, Nivel, TipoRespuesta, type PaqueteContenido } from '../../dominio/modelo';
import { crearFiltroSeguridad } from '../filtroSeguridad';
import { crearNormalizador, normalizarTexto } from '../normalizador';
import { REGLAS } from '../reglas';
import { CASOS } from './casos';
import contenidoMini from './fixtures/contenido-mini.json';

const paquete = contenidoMini as unknown as PaqueteContenido;
const normalizador = crearNormalizador(paquete.sinonimos);
const filtro = crearFiltroSeguridad(REGLAS, paquete);
const evaluar = (texto: string, estacionId: string | null = null) =>
  filtro.evaluar(normalizador.normalizar(texto, estacionId, Nivel.BREVE));

describe('normalizador', () => {
  test('minúsculas, sin tildes ni signos', () => {
    expect(normalizarTexto('¿Qué papel cumple el FRAILEJÓN?')).toBe('que papel cumple el frailejon');
    expect(normalizarTexto('¿Me puedo bañar?')).toBe('me puedo banar');
  });

  test('abreviaturas frecuentes', () => {
    expect(normalizarTexto('q papel tiene, xq?')).toBe('que papel tiene por que');
  });

  test('agrega el término canónico de los sinónimos sin borrar el original', () => {
    const c = normalizador.normalizar('¿Por qué las piedras del Valle Lunar son rojas?', null, Nivel.BREVE);
    expect(c.textoNormalizado).toContain('piedras');
    expect(c.textoNormalizado).toContain('rocas');
    expect(c.textoNormalizado).toContain('lunares');
    expect(c.textoNormalizado).toContain('rojizo');
  });

  test('conserva estación y nivel', () => {
    const c = normalizador.normalizar('hola', 'lunares', Nivel.AMPLIADO);
    expect(c).toMatchObject({ textoOriginal: 'hola', estacionId: 'lunares', nivel: Nivel.AMPLIADO });
  });
});

describe('filtro: los 4 casos de límites del jurado', () => {
  const limites = CASOS.filter(c => c.jurado && c.esperado.motivo);

  test('son 4', () => expect(limites).toHaveLength(4));

  test.each(limites)('$nombre', caso => {
    const r = evaluar(caso.pregunta, caso.estacionId);
    expect(r).not.toBeNull();
    expect(r!.tipo).toBe(caso.esperado.tipo);
    expect(r!.motivo).toBe(caso.esperado.motivo);
    expect(r!.citas).toEqual([]);
  });
});

describe('filtro: todos los casos de límite del set', () => {
  const limites = CASOS.filter(c => c.esperado.motivo && c.esperado.motivo !== MotivoLimite.SIN_EVIDENCIA);

  test.each(limites)('$nombre', caso => {
    const r = evaluar(caso.pregunta, caso.estacionId);
    expect(r?.tipo).toBe(caso.esperado.tipo);
    expect(r?.motivo).toBe(caso.esperado.motivo);
    expect(r!.citas.map(c => c.pagina)).toEqual(caso.esperado.paginas ?? []);
    expect(r!.texto).toMatch(/guía|personal/);
  });
});

describe('filtro: no bloquea preguntas que el guion responde', () => {
  const respondibles = [
    ...CASOS.filter(c => !c.esperado.motivo || c.esperado.motivo === MotivoLimite.SIN_EVIDENCIA)
      .map(c => c.pregunta),
    '¿Cómo es el clima del páramo?',
    '¿Por qué el oxígeno pone rojas las rocas?',
    '¿Por qué es importante este parque para el agua?',
    '¿El volcán está activo?',
    '¿Cuándo fue la erupción de 1985?',
    '¿Qué es la necromasa?',
  ];

  test.each(respondibles)('%s', pregunta => {
    expect(evaluar(pregunta)).toBeNull();
  });
});

describe('filtro: citas de normas', () => {
  test('cita la norma con su texto del guion, no un texto inventado', () => {
    const r = evaluar('¿Puedo caminar sobre las dunas?', 'arenales')!;
    const norma = paquete.fragmentos.find(f => f.id === 'uton2024-p7-dc4')!;
    expect(r.texto).toContain(norma.texto);
    expect(r.citas).toEqual([
      { guionTitulo: 'Guion Ecoturístico UTON 2024', pagina: 7, estacionNombre: 'Arenales', naturaleza: 'norma' },
    ]);
  });

  test('si la norma no está en el paquete, queda el mensaje fijo sin cita', () => {
    const sinNormas = { ...paquete, fragmentos: paquete.fragmentos.filter(f => f.naturaleza !== 'norma') };
    const r = crearFiltroSeguridad(REGLAS, sinNormas as PaqueteContenido)
      .evaluar(normalizador.normalizar('¿Podemos subir hasta el cráter?', null, Nivel.BREVE))!;
    expect(r.tipo).toBe(TipoRespuesta.REMISION_AL_PERSONAL);
    expect(r.citas).toEqual([]);
    expect(r.texto).not.toMatch(/Esto dice el guion/);
  });

  test('nunca usa contenido no apto (salud de altura)', () => {
    const r = evaluar('¿Qué es el mal agudo de montaña?')!;
    expect(r.motivo).toBe(MotivoLimite.SALUD);
    expect(r.texto).not.toMatch(/4,287|estudio/i);
  });
});
