/** GestorFichas: contraseña, validar, publicar/retirar con reindexado, persistencia, exportar/importar (B6). */
import {
  AlcanceRestriccion,
  EstadoFicha,
  Naturaleza,
  Nivel,
  Tema,
  TipoRespuesta,
  type Almacen,
  type ConfiguracionApp,
  type FichaContenido,
  type MotorModelo,
  type PaqueteContenido,
} from '../../dominio/modelo';
import { crearAsistente } from '..';
import { CLAVE_FICHAS, subirVersion } from '../fichas';
import contenidoMini from './fixtures/contenido-mini.json';

const paquete = contenidoMini as unknown as PaqueteContenido;

/** sha256('1234') */
const HASH_1234 = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4';

const config: ConfiguracionApp = {
  rutaModelo: 'modelo-falso.gguf', umbralEvidencia: 8, maxFragmentos: 3, maxTokens: 200,
  timeoutModeloMs: 1000, pinAdministracion: HASH_1234, idioma: 'es', geocercaActiva: false,
  alcanceRestriccion: AlcanceRestriccion.APP_COMPLETA, precisionMaximaM: 50,
  intervaloGpsMs: 10000, pinModoDemo: '0000',
};

function almacenEnMemoria(): Almacen & { datos: Map<string, string> } {
  const datos = new Map<string, string>();
  return {
    datos,
    leer: clave => datos.get(clave),
    escribir: (clave, valor) => void datos.set(clave, valor),
    borrar: clave => void datos.delete(clave),
  };
}

const modelo: MotorModelo = {
  cargar: async () => {}, estaListo: () => true, liberar: async () => {},
  generar: async () => 'Respuesta de prueba.',
};

const nuevo = (almacen = almacenEnMemoria()) => ({
  almacen,
  asistente: crearAsistente({ paquete, config, almacen, modelo }),
});

/** Ficha que reemplaza el texto del frailejón (UTON p. 5) con un documento revisado. */
const fichaFrailejon = (cambios: Partial<FichaContenido> = {}): FichaContenido => ({
  id: 'frailejon-2026',
  titulo: 'El frailejón, actualizado',
  estacionId: 'aguacerales',
  tema: Tema.ESTACION,
  naturaleza: Naturaleza.CIENTIFICO,
  texto: 'El frailejón retiene el agua de la niebla con sus hojas peludas y su necromasa, y la entrega poco a poco al suelo.',
  fuente: { documento: 'Ficha técnica UTON 2026', pagina: 2 },
  version: 0,
  estado: EstadoFicha.BORRADOR,
  aprobadaPor: 'Coordinación de guías',
  fechaRevision: '2026-11-26',
  reemplazaFragmentoIds: ['uton2024-p5-3'],
  ...cambios,
});

const PREGUNTA = '¿Qué papel cumple el frailejón?';
const responder = (a: ReturnType<typeof crearAsistente>) =>
  a.orquestador.responder(PREGUNTA, 'aguacerales', Nivel.BREVE);

describe('contraseña', () => {
  test('desbloquea solo con la contraseña correcta (sha256)', () => {
    const { asistente } = nuevo();
    expect(asistente.fichas.desbloquear('0000')).toBe(false);
    expect(asistente.fichas.desbloquear(HASH_1234)).toBe(false); // el hash no sirve como contraseña
    expect(asistente.fichas.desbloquear('1234')).toBe(true);
  });

  test('sin desbloquear no se puede escribir', async () => {
    const { asistente } = nuevo();
    await expect(asistente.fichas.guardarBorrador(fichaFrailejon())).rejects.toThrow(/contraseña/);
    await expect(asistente.fichas.activar('x')).rejects.toThrow(/contraseña/);
    await expect(asistente.fichas.exportar()).rejects.toThrow(/contraseña/);
  });

  test('sin pinAdministracion configurado nunca desbloquea', () => {
    const a = crearAsistente({ paquete, config: { ...config, pinAdministracion: '' }, almacen: almacenEnMemoria() });
    expect(a.fichas.desbloquear('')).toBe(false);
  });
});

describe('validar (mensajes claros)', () => {
  const { asistente } = nuevo();
  const validar = (c: Partial<FichaContenido>) => asistente.fichas.validar(fichaFrailejon(c));

  test('ficha completa → sin errores', () => expect(validar({})).toEqual([]));

  test.each([
    [{ texto: '  ' }, 'Falta el texto.'],
    [{ titulo: '' }, 'Falta el título.'],
    [{ aprobadaPor: '' }, 'Indica quién revisó la ficha (cargo).'],
    [{ fuente: { documento: '' } }, 'Indica la página o el documento de donde sale.'],
    [{ fuente: { guionId: 'uton2024', pagina: 99 } }, 'La página debe estar entre 1 y 57.'],
    [{ fuente: { guionId: 'otro', pagina: 1 } }, 'El guion indicado no existe.'],
    [{ estacionId: 'cumbre' }, 'La estación elegida no existe.'],
    [{ tema: Tema.SALUD_ALTURA }, 'El contenido de salud de altura no se puede editar desde aquí.'],
    [{ reemplazaFragmentoIds: ['no-existe'] }, 'El fragmento que quieres reemplazar no existe: no-existe.'],
    [{ texto: 'x'.repeat(1501) }, 'El texto es muy largo: máximo 1.500 caracteres.'],
  ] as [Partial<FichaContenido>, string][])('%o', (cambios, mensaje) => {
    expect(validar(cambios)).toContain(mensaje);
  });

  test('publicar una ficha inválida falla con los mensajes', async () => {
    const { asistente: a } = nuevo();
    a.fichas.desbloquear('1234');
    await a.fichas.guardarBorrador(fichaFrailejon({ texto: '' }));
    await expect(a.fichas.activar('frailejon-2026')).rejects.toThrow('Falta el texto.');
  });
});

describe('publicar y retirar', () => {
  test('al publicar, la siguiente pregunta cita la ficha nueva (sin reiniciar)', async () => {
    const { asistente } = nuevo();
    const antes = await responder(asistente);
    expect(antes.citas.map(c => [c.guionTitulo, c.pagina])).toEqual([['Guion Ecoturístico UTON 2024', 5]]);

    asistente.fichas.desbloquear('1234');
    await asistente.fichas.guardarBorrador(fichaFrailejon());
    expect((await responder(asistente)).citas[0].pagina).toBe(5); // borrador: aún no cuenta

    await asistente.fichas.activar('frailejon-2026');
    const despues = await responder(asistente);
    expect(despues.tipo).toBe(TipoRespuesta.RESPONDIDA);
    expect(despues.citas.map(c => [c.guionTitulo, c.pagina])).toEqual([['Ficha técnica UTON 2026', 2]]);
  });

  test('publicar sube la versión del guion; retirar la vuelve a subir', async () => {
    const { asistente } = nuevo();
    expect(asistente.versionGuion()).toBe('mini-2024.1');
    asistente.fichas.desbloquear('1234');
    await asistente.fichas.guardarBorrador(fichaFrailejon());
    await asistente.fichas.activar('frailejon-2026');
    expect(asistente.versionGuion()).toBe('mini-2024.2');
    await asistente.fichas.retirar('frailejon-2026');
    expect(asistente.versionGuion()).toBe('mini-2024.3');
  });

  test('retirar vuelve al texto original del guion', async () => {
    const { asistente } = nuevo();
    asistente.fichas.desbloquear('1234');
    await asistente.fichas.guardarBorrador(fichaFrailejon());
    await asistente.fichas.activar('frailejon-2026');
    await asistente.fichas.retirar('frailejon-2026');
    expect((await responder(asistente)).citas).toEqual([
      expect.objectContaining({ guionTitulo: 'Guion Ecoturístico UTON 2024', pagina: 5 }),
    ]);
  });

  test('una ficha con fuente en el guion cita guion y página', async () => {
    const { asistente } = nuevo();
    asistente.fichas.desbloquear('1234');
    await asistente.fichas.guardarBorrador(fichaFrailejon({ fuente: { guionId: 'zona_norte', pagina: 5 } }));
    await asistente.fichas.activar('frailejon-2026');
    expect((await responder(asistente)).citas[0]).toMatchObject({ guionTitulo: 'Guion turístico zona norte', pagina: 5 });
  });

  test('editar una ficha publicada como borrador la saca de las respuestas', async () => {
    const { asistente } = nuevo();
    asistente.fichas.desbloquear('1234');
    await asistente.fichas.guardarBorrador(fichaFrailejon());
    await asistente.fichas.activar('frailejon-2026');
    await asistente.fichas.guardarBorrador(fichaFrailejon({ texto: 'Otro texto en revisión.' }));
    expect((await responder(asistente)).citas[0].pagina).toBe(5);
  });

  test('una ficha nueva (sin reemplazar nada) también se encuentra', async () => {
    const { asistente } = nuevo();
    asistente.fichas.desbloquear('1234');
    await asistente.fichas.guardarBorrador(fichaFrailejon({
      id: 'truchas', titulo: 'Truchas en las quebradas', estacionId: 'aguacerales', reemplazaFragmentoIds: [],
      texto: 'Las truchas de las quebradas del parque son una especie introducida.',
    }));
    await asistente.fichas.activar('truchas');
    const r = await asistente.orquestador.responder('¿Hay truchas en las quebradas?', 'aguacerales', Nivel.BREVE);
    expect(r.tipo).toBe(TipoRespuesta.RESPONDIDA);
    expect(r.citas[0].guionTitulo).toBe('Ficha técnica UTON 2026');
  });
});

describe('persistencia', () => {
  test('las fichas publicadas sobreviven a reiniciar la app', async () => {
    const primero = nuevo();
    primero.asistente.fichas.desbloquear('1234');
    await primero.asistente.fichas.guardarBorrador(fichaFrailejon());
    await primero.asistente.fichas.activar('frailejon-2026');
    expect(primero.almacen.datos.has(CLAVE_FICHAS)).toBe(true);

    const reinicio = nuevo(primero.almacen);
    expect(reinicio.asistente.versionGuion()).toBe('mini-2024.2');
    expect((await responder(reinicio.asistente)).citas[0].guionTitulo).toBe('Ficha técnica UTON 2026');
  });

  test('un dato guardado corrupto no rompe el asistente', async () => {
    const almacen = almacenEnMemoria();
    almacen.escribir(CLAVE_FICHAS, '{no es json');
    const { asistente } = nuevo(almacen);
    expect(asistente.versionGuion()).toBe('mini-2024.1');
    expect((await responder(asistente)).citas[0].pagina).toBe(5);
  });
});

describe('exportar e importar', () => {
  test('lo publicado en un celular se importa en otro', async () => {
    const origen = nuevo().asistente;
    origen.fichas.desbloquear('1234');
    await origen.fichas.guardarBorrador(fichaFrailejon());
    await origen.fichas.activar('frailejon-2026');
    const archivo = await origen.fichas.exportar();
    expect(JSON.parse(archivo)).toMatchObject({ formato: 'paramon-fichas', version: 1 });

    const destino = nuevo().asistente;
    destino.fichas.desbloquear('1234');
    const importadas = await destino.fichas.importar(archivo);
    expect(importadas).toHaveLength(1);
    expect((await responder(destino)).citas[0].guionTitulo).toBe('Ficha técnica UTON 2026');
  });

  test('archivo que no es de fichas → mensaje claro y no cambia nada', async () => {
    const { asistente } = nuevo();
    asistente.fichas.desbloquear('1234');
    await expect(asistente.fichas.importar('hola')).rejects.toThrow('El archivo no es un archivo de fichas válido.');
    await expect(asistente.fichas.importar('{"otra":"cosa"}')).rejects.toThrow('no es un archivo de fichas');
    expect(asistente.versionGuion()).toBe('mini-2024.1');
  });

  test('fichas inválidas en el archivo → no se importa ninguna', async () => {
    const { asistente } = nuevo();
    asistente.fichas.desbloquear('1234');
    const archivo = JSON.stringify([fichaFrailejon({ estado: EstadoFicha.APROBADA, texto: '' })]);
    await expect(asistente.fichas.importar(archivo)).rejects.toThrow(/Falta el texto/);
    expect((await responder(asistente)).citas[0].pagina).toBe(5);
  });
});

describe('subirVersion', () => {
  test.each([
    ['2024.1', 0, '2024.1'],
    ['2024.1', 1, '2024.2'],
    ['2024.9', 3, '2024.12'],
    ['beta', 2, 'beta.2'],
  ] as const)('%s + %i → %s', (base, n, esperado) => expect(subirVersion(base, n)).toBe(esperado));
});
