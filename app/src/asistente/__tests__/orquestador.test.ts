/** Orquestador + prompt + ciclo de vida del modelo, con modelos falsos (B5). */
import {
  AlcanceRestriccion,
  Nivel,
  TipoRespuesta,
  type ConfiguracionApp,
  type MotorModelo,
  type PaqueteContenido,
} from '../../dominio/modelo';
import { crearAsistente } from '..';
import { limpiarTextoModelo } from '../orquestador';
import { SISTEMA_AMPLIADO, SISTEMA_BREVE } from '../prompt';
import contenidoMini from './fixtures/contenido-mini.json';

const paquete = contenidoMini as unknown as PaqueteContenido;

const config: ConfiguracionApp = {
  rutaModelo: 'modelo-falso.gguf', umbralEvidencia: 8, maxFragmentos: 3, maxTokens: 200,
  timeoutModeloMs: 80, pinAdministracion: '1234', idioma: 'es', geocercaActiva: false,
  alcanceRestriccion: AlcanceRestriccion.APP_COMPLETA, precisionMaximaM: 50,
  intervaloGpsMs: 10000, pinModoDemo: '0000',
};

const almacen = { leer: () => undefined, escribir: () => {}, borrar: () => {} };
const esperar = (ms: number) => new Promise(r => setTimeout(r, ms));

/** Modelo falso configurable que registra los prompts que recibe. */
function modeloFalso(opciones: {
  responde?: string | (() => Promise<string>);
  listo?: boolean;
  cargaMs?: number;
  cargaFalla?: boolean;
} = {}) {
  let listo = opciones.listo ?? true;
  const prompts: { sistema: string; usuario: string }[] = [];
  let cargas = 0;
  const modelo: MotorModelo = {
    async cargar() {
      cargas++;
      await esperar(opciones.cargaMs ?? 0);
      if (opciones.cargaFalla) throw new Error('no cargó');
      listo = true;
    },
    async generar(p) {
      prompts.push(p);
      const r = opciones.responde ?? 'El frailejón capta y regula el agua.';
      return typeof r === 'string' ? r : r();
    },
    estaListo: () => listo,
    async liberar() { listo = false; },
  };
  return { modelo, prompts, cargas: () => cargas };
}

const preguntar = (modelo: MotorModelo, texto: string, estacionId: string | null, nivel = Nivel.BREVE) =>
  crearAsistente({ paquete, config, almacen, modelo }).orquestador.responder(texto, estacionId, nivel);

describe('con modelo', () => {
  test('redacta el modelo, cita el sistema', async () => {
    const { modelo } = modeloFalso();
    const r = await preguntar(modelo, '¿Qué papel cumple el frailejón?', 'aguacerales');
    expect(r.tipo).toBe(TipoRespuesta.RESPONDIDA);
    expect(r.texto).toBe('El frailejón capta y regula el agua.');
    expect(r.citas.map(c => c.pagina)).toEqual([5]);
    expect(r.ampliable).toBe(true);
    expect(r.tiempoMs).toBeGreaterThanOrEqual(0);
  });

  test('las páginas o marcas que invente el modelo se borran; las citas no cambian', async () => {
    const { modelo } = modeloFalso({ responde: 'Las dunas guardan huellas por meses [1] (p. 99).' });
    const r = await preguntar(modelo, '¿Por qué evitar pisar las dunas?', 'arenales');
    expect(r.texto).toBe('Las dunas guardan huellas por meses.');
    expect(r.citas.map(c => c.pagina)).toEqual([7]);
  });

  test('en AMPLIADO no se ofrece ampliar otra vez', async () => {
    const { modelo, prompts } = modeloFalso();
    const r = await preguntar(modelo, '¿Qué papel cumple el frailejón?', 'aguacerales', Nivel.AMPLIADO);
    expect(r.ampliable).toBe(false);
    expect(prompts[0].sistema).toBe(SISTEMA_AMPLIADO);
  });
});

describe('respaldo sin modelo', () => {
  const casos: [string, Parameters<typeof modeloFalso>[0]][] = [
    ['tarda más que timeoutModeloMs', { responde: () => esperar(500).then(() => 'tarde') }],
    ['lanza un error', { responde: () => Promise.reject(new Error('falló')) }],
    ['devuelve vacío', { responde: '   ' }],
    ['dice que no sabe', { responde: 'No lo sé, no está en los fragmentos.' }],
    ['no carga a tiempo', { listo: false, cargaMs: 500 }],
    ['no carga nunca', { listo: false, cargaFalla: true }],
  ];

  test.each(casos)('el modelo %s → guion tal cual, con su cita', async (_n, opciones) => {
    const { modelo } = modeloFalso(opciones);
    const r = await preguntar(modelo, '¿Qué papel cumple el frailejón?', 'aguacerales');
    expect(r.tipo).toBe(TipoRespuesta.RESPALDO_SIN_MODELO);
    expect(r.texto).toMatch(/necromasa/);
    expect(r.citas.map(c => c.pagina)).toEqual([5]);
    expect(r.tiempoMs).toBeLessThan(400);
  });

  test('sin modelo inyectado → respaldo', async () => {
    const a = crearAsistente({ paquete, config, almacen });
    const r = await a.orquestador.responder('¿Qué papel cumple el frailejón?', 'aguacerales', Nivel.BREVE);
    expect(r.tipo).toBe(TipoRespuesta.RESPALDO_SIN_MODELO);
  });
});

describe('el modelo no se usa cuando no corresponde', () => {
  test.each([
    ['límite de seguridad', 'Me duele la cabeza, ¿qué tomo?', TipoRespuesta.REMISION_AL_PERSONAL],
    ['sin evidencia', '¿Cuántas truchas hay en las quebradas?', TipoRespuesta.ABSTENCION],
    ['diferencia entre fuentes', '¿De dónde viene Kumanday?', TipoRespuesta.CON_DIFERENCIA_ENTRE_FUENTES],
  ])('%s', async (_n, pregunta, tipo) => {
    const { modelo, prompts } = modeloFalso();
    const r = await preguntar(modelo, pregunta, 'valle_tumbas');
    expect(r.tipo).toBe(tipo);
    expect(prompts).toHaveLength(0);
  });
});

describe('prompt', () => {
  test('instrucciones fijas + fragmentos numerados + pregunta; sin guion ni página', async () => {
    const { modelo, prompts } = modeloFalso();
    await preguntar(modelo, '¿Qué explica las fracturas y qué el color?', 'lunares');
    const { sistema, usuario } = prompts[0];
    expect(sistema).toBe(SISTEMA_BREVE);
    expect(sistema).toMatch(/SOLO con la información/);
    expect(sistema).toMatch(/No des indicaciones de seguridad ni de salud/);
    expect(usuario).toMatch(/\[1\] .*\n\[2\] /);
    expect(usuario).toMatch(/gelifracción/);
    expect(usuario).toMatch(/oxidación/);
    expect(usuario).toMatch(/Pregunta: ¿Qué explica las fracturas y qué el color\?$/);
    expect(usuario).not.toMatch(/Guion|p\. ?\d|página/i);
  });

  test('marca los relatos de tradición oral', async () => {
    const { modelo, prompts } = modeloFalso();
    await preguntar(modelo, '¿Qué mito hay en Arenales sobre una niña fantasma?', 'arenales');
    expect(prompts[0].usuario).toMatch(/\[relato de tradición oral\]/);
  });

  test('el contenido no apto nunca entra al prompt', async () => {
    const { modelo, prompts } = modeloFalso();
    await preguntar(modelo, '¿Qué estudios se han hecho con turistas en el Ruiz?', null);
    expect(prompts.map(p => p.usuario).join('')).not.toMatch(/Mal Agudo de Montaña/);
  });
});

describe('ciclo de vida del modelo', () => {
  test('precargarModelo carga una sola vez aunque se llame varias', async () => {
    const f = modeloFalso({ listo: false, cargaMs: 20 });
    const a = crearAsistente({ paquete, config, almacen, modelo: f.modelo });
    await Promise.all([a.precargarModelo(), a.precargarModelo(), a.precargarModelo()]);
    expect(f.cargas()).toBe(1);
    const r = await a.orquestador.responder('¿Qué papel cumple el frailejón?', 'aguacerales', Nivel.BREVE);
    expect(r.tipo).toBe(TipoRespuesta.RESPONDIDA);
  });

  test('precargar y liberar nunca lanzan, aunque el modelo falle', async () => {
    const f = modeloFalso({ listo: false, cargaFalla: true });
    const a = crearAsistente({ paquete, config, almacen, modelo: f.modelo });
    await expect(a.precargarModelo()).resolves.toBeUndefined();
    await expect(a.liberarModelo()).resolves.toBeUndefined();
  });

  test('tras liberar, la siguiente pregunta vuelve a cargar', async () => {
    const f = modeloFalso({ listo: false });
    const a = crearAsistente({ paquete, config, almacen, modelo: f.modelo });
    await a.precargarModelo();
    await a.liberarModelo();
    const r = await a.orquestador.responder('¿Qué papel cumple el frailejón?', 'aguacerales', Nivel.BREVE);
    expect(f.cargas()).toBe(2);
    expect(r.tipo).toBe(TipoRespuesta.RESPONDIDA);
  });
});

describe('limpiarTextoModelo', () => {
  test.each([
    ['Texto [2] limpio.', 'Texto limpio.'],
    ['Según la página 5, sí.', 'Según la, sí.'],
    ['Dato (pág. 12).', 'Dato.'],
    ['Sin marcas.', 'Sin marcas.'],
  ])('%s', (entrada, salida) => expect(limpiarTextoModelo(entrada)).toBe(salida));
});
