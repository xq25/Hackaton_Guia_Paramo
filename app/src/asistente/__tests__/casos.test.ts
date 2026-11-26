/**
 * Set de casos contra crearAsistente() con un modelo falso (nunca llama.rn), sobre:
 * - el contenido.json REAL de A (S5): es la prueba que cuenta para la demo;
 * - el fixture escrito a mano: no depende de que A regenere el contenido.
 * Valores de configuración calibrados en B5 (van a config.ts de C en S7).
 */
import {
  AlcanceRestriccion,
  Naturaleza,
  Nivel,
  TipoRespuesta,
  type Almacen,
  type ConfiguracionApp,
  type MotorModelo,
  type PaqueteContenido,
} from '../../dominio/modelo';
import { crearAsistente } from '..';
import { REGLAS } from '../reglas';
import { CASOS } from './casos';
import contenidoReal from '../../../assets/contenido.json';
import contenidoMini from './fixtures/contenido-mini.json';

const REAL = contenidoReal as unknown as PaqueteContenido;
const MINI = contenidoMini as unknown as PaqueteContenido;

/** Valores propuestos para config.ts (B5). */
const CONFIG_CALIBRADA = { umbralEvidencia: 3, maxFragmentos: 3 } as const;

const config: ConfiguracionApp = {
  rutaModelo: 'modelo-falso.gguf',
  ...CONFIG_CALIBRADA,
  maxTokens: 200,
  timeoutModeloMs: 2000,
  pinAdministracion: '',
  idioma: 'es',
  geocercaActiva: false,
  alcanceRestriccion: AlcanceRestriccion.APP_COMPLETA,
  precisionMaximaM: 50,
  intervaloGpsMs: 10000,
  pinModoDemo: '',
};

function almacenEnMemoria(): Almacen {
  const datos = new Map<string, string>();
  return {
    leer: clave => datos.get(clave),
    escribir: (clave, valor) => void datos.set(clave, valor),
    borrar: clave => void datos.delete(clave),
  };
}

const modeloFalso: MotorModelo = {
  cargar: async () => {},
  generar: async () => 'Respuesta redactada por el modelo de prueba.',
  estaListo: () => true,
  liberar: async () => {},
};

const nuevoAsistente = (paquete: PaqueteContenido) =>
  crearAsistente({ paquete, config, almacen: almacenEnMemoria(), modelo: modeloFalso });

describe.each([
  ['contenido.json real', REAL],
  ['fixture', MINI],
] as const)('%s', (_nombre, paquete) => {
  describe('estructura', () => {
    const ids = new Set(paquete.fragmentos.map(f => f.id));
    const estaciones = new Set(paquete.estaciones.map(e => e.id));
    const guiones = new Set(paquete.guiones.map(g => g.id));

    test('ids de fragmento únicos', () => expect(ids.size).toBe(paquete.fragmentos.length));

    test('cada fragmento apunta a un guion, una página y una estación válidos', () => {
      for (const f of paquete.fragmentos) {
        expect(guiones.has(f.guionId)).toBe(true);
        expect(f.pagina).toBeGreaterThan(0);
        if (f.estacionId !== null) expect(estaciones.has(f.estacionId)).toBe(true);
      }
    });

    test('las diferencias entre fuentes apuntan a fragmentos existentes', () => {
      for (const d of paquete.diferencias) for (const id of d.fragmentoIds) expect(ids.has(id)).toBe(true);
    });

    test('las normas que citan las reglas existen y son de tipo norma', () => {
      for (const regla of REGLAS.filter(r => r.fragmentoApoyoId)) {
        const f = paquete.fragmentos.find(x => x.id === regla.fragmentoApoyoId);
        expect({ regla: regla.id, naturaleza: f?.naturaleza, apto: f?.apto })
          .toEqual({ regla: regla.id, naturaleza: Naturaleza.NORMA, apto: true });
      }
    });
  });

  describe('casos', () => {
    const asistente = nuevoAsistente(paquete);

    test.each(CASOS)('$nombre', async caso => {
      const r = await asistente.orquestador.responder(caso.pregunta, caso.estacionId, Nivel.BREVE);

      expect(r.tipo).toBe(caso.esperado.tipo);
      if (caso.esperado.motivo) expect(r.motivo).toBe(caso.esperado.motivo);

      const paginasCitadas = r.citas.map(c => c.pagina);
      if (caso.esperado.paginas) {
        expect(paginasCitadas).toEqual(expect.arrayContaining(caso.esperado.paginas));
      } else {
        expect(r.citas).toEqual([]);
      }
      expect(r.texto.length).toBeGreaterThan(0);
    });
  });

  describe('responder() nunca lanza', () => {
    const asistente = nuevoAsistente(paquete);

    test.each([
      ['texto vacío', '', null],
      ['estación desconocida', '¿Qué es esto?', 'no_existe'],
      ['solo signos', '¿¿¿???', 'lunares'],
    ] as const)('%s', async (_n, texto, estacionId) => {
      await expect(asistente.orquestador.responder(texto, estacionId, Nivel.BREVE)).resolves.toHaveProperty('tipo');
    });

    test('paquete roto devuelve respuesta, no excepción', async () => {
      const roto = crearAsistente({
        paquete: { ...paquete, fragmentos: null } as unknown as PaqueteContenido,
        config, almacen: almacenEnMemoria(), modelo: modeloFalso,
      });
      await expect(roto.orquestador.responder('frailejón', 'aguacerales', Nivel.BREVE)).resolves.toHaveProperty('tipo');
    });
  });
});

describe('contenido.json real: preguntas del guion fuera del set del jurado', () => {
  const asistente = nuevoAsistente(REAL);

  test.each([
    ['¿Qué pasó en Armero?', null],
    ['¿Quién es Nelson Cardona?', 'arenales'],
    ['¿Qué es la pubescencia?', null],
    ['¿Qué es un carámbano?', null],
    ['¿Qué es la necromasa?', null],
    ['¿Qué es un lahar?', null],
    ['¿Cuántos municipios reciben agua del parque?', null],
    ['¿Por qué hay dunas en Arenales?', null],
  ] as const)('%s → se responde con cita', async (pregunta, estacionId) => {
    const r = await asistente.orquestador.responder(pregunta, estacionId, Nivel.BREVE);
    expect(r.tipo).toBe(TipoRespuesta.RESPONDIDA);
    expect(r.citas.length).toBeGreaterThan(0);
  });
});
