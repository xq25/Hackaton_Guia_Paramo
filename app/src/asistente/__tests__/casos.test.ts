/**
 * Corre el set de casos contra crearAsistente() con un modelo falso (nunca llama.rn).
 * Con el stub de B0 la mayoría falla: es lo esperado hasta B2/B3/B5.
 */
import {
  AlcanceRestriccion,
  Nivel,
  type Almacen,
  type ConfiguracionApp,
  type MotorModelo,
  type PaqueteContenido,
} from '../../dominio/modelo';
import { crearAsistente } from '..';
import { CASOS } from './casos';
import contenidoMini from './fixtures/contenido-mini.json';

const paquete = contenidoMini as unknown as PaqueteContenido;

const config: ConfiguracionApp = {
  rutaModelo: 'modelo-falso.gguf',
  umbralEvidencia: 8,          // calibrado con el fixture en B3; el real se calibra en B5
  maxFragmentos: 3,
  maxTokens: 200,
  timeoutModeloMs: 2000,
  pinAdministracion: '1234',
  idioma: 'es',
  geocercaActiva: false,
  alcanceRestriccion: AlcanceRestriccion.APP_COMPLETA,
  precisionMaximaM: 50,
  intervaloGpsMs: 10000,
  pinModoDemo: '0000',
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

const nuevoAsistente = () =>
  crearAsistente({ paquete, config, almacen: almacenEnMemoria(), modelo: modeloFalso });

describe('fixture contenido-mini', () => {
  const ids = new Set(paquete.fragmentos.map(f => f.id));
  const estaciones = new Set(paquete.estaciones.map(e => e.id));
  const guiones = new Set(paquete.guiones.map(g => g.id));

  test('ids de fragmento únicos', () => {
    expect(ids.size).toBe(paquete.fragmentos.length);
  });

  test('cada fragmento apunta a un guion, una página y una estación válidos', () => {
    for (const f of paquete.fragmentos) {
      expect(guiones.has(f.guionId)).toBe(true);
      expect(f.pagina).toBeGreaterThan(0);
      if (f.estacionId !== null) expect(estaciones.has(f.estacionId)).toBe(true);
    }
  });

  test('las diferencias entre fuentes apuntan a fragmentos existentes', () => {
    for (const d of paquete.diferencias) {
      for (const id of d.fragmentoIds) expect(ids.has(id)).toBe(true);
    }
  });
});

describe('casos del asistente', () => {
  const asistente = nuevoAsistente();

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
  const asistente = nuevoAsistente();

  test.each([
    ['texto vacío', '', null],
    ['estación desconocida', '¿Qué es esto?', 'no_existe'],
    ['solo signos', '¿¿¿???', 'lunares'],
  ] as const)('%s', async (_nombre, texto, estacionId) => {
    await expect(
      asistente.orquestador.responder(texto, estacionId, Nivel.BREVE),
    ).resolves.toHaveProperty('tipo');
  });

  test('paquete roto devuelve respuesta, no excepción', async () => {
    const roto = crearAsistente({
      paquete: { ...paquete, fragmentos: null } as unknown as PaqueteContenido,
      config, almacen: almacenEnMemoria(), modelo: modeloFalso,
    });
    await expect(roto.orquestador.responder('frailejón', 'aguacerales', Nivel.BREVE))
      .resolves.toHaveProperty('tipo');
  });
});
