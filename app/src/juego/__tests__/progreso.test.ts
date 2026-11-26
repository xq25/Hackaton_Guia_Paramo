import { MetodoRegistro, type Almacen, type PaqueteContenido } from '../../dominio/modelo';
import { crearGestorProgreso } from '../progreso';
import contenido from '../../../assets/contenido.json';

const paquete = contenido as unknown as PaqueteContenido;

function almacenFalso(): Almacen {
  const datos = new Map<string, string>();
  return { leer: k => datos.get(k), escribir: (k, v) => void datos.set(k, v), borrar: k => void datos.delete(k) };
}

function gestor(dia = { valor: '2026-11-26' }) {
  return crearGestorProgreso({ paquete, almacen: almacenFalso(), hoy: () => dia.valor });
}

const ESTACIONES = ['brisas', 'aguacerales', 'arenales', 'lunares', 'valle_tumbas'];

describe('registrarVisita', () => {
  it('la primera visita da bronce, la carta de la estación y sus especies', async () => {
    const g = gestor();
    const r = await g.registrarVisita('aguacerales', MetodoRegistro.DEMO);
    expect(r.nueva).toBe(true);
    expect(r.insignias.map(i => i.id)).toContain('aguacerales_1');
    expect(r.coleccionables.map(c => c.id)).toEqual(expect.arrayContaining(['estacion_aguacerales', 'frailejon', 'pajonal']));
    const p = await g.cargar();
    expect(g.especieDesbloqueada(p, 'Espeletia hartwegiana')).toBe(true);
    expect(g.especieDesbloqueada(p, 'Vultur gryphus')).toBe(false);
  });

  it('repetir el mismo día no suma', async () => {
    const g = gestor();
    await g.registrarVisita('lunares', MetodoRegistro.DEMO);
    const r = await g.registrarVisita('lunares', MetodoRegistro.DEMO);
    expect(r.nueva).toBe(false);
    expect((await g.cargar()).visitas).toHaveLength(1);
  });

  it('5 visitas en días distintos dan oro (maestro de la estación)', async () => {
    const dia = { valor: '' };
    const g = gestor(dia);
    const ganadas: string[] = [];
    for (const d of ['01', '02', '03', '04', '05']) {
      dia.valor = `2026-12-${d}`;
      ganadas.push(...(await g.registrarVisita('arenales', MetodoRegistro.DEMO)).insignias.map(i => i.id));
    }
    expect(ganadas).toEqual(['arenales_1', 'arenales_2', 'arenales_3']);
  });

  it('el recorrido completo en un día da Explorador y la carta de la danta', async () => {
    const g = gestor();
    let ultimo;
    for (const e of ESTACIONES) ultimo = await g.registrarVisita(e, MetodoRegistro.DEMO);
    expect(ultimo!.insignias.map(i => i.id)).toContain('recorrido_1');
    expect(ultimo!.coleccionables.map(c => c.id)).toContain('danta');
  });

  it('rechaza una estación que no existe', async () => {
    await expect(gestor().registrarVisita('otra', MetodoRegistro.DEMO)).rejects.toThrow();
  });
});

describe('responderReto', () => {
  it('4 retos correctos dan Sabio del páramo y la carta del periquito', async () => {
    const g = gestor();
    for (const r of paquete.retos) {
      expect(await g.responderReto(r.id, r.indiceCorrecta)).toBe(true);
    }
    const p = await g.cargar();
    expect(p.insigniasIds).toContain('sabio_paramo');
    expect(p.coleccionablesIds).toContain('periquito');
  });

  it('una respuesta incorrecta no cuenta', async () => {
    const g = gestor();
    const reto = paquete.retos[0];
    expect(await g.responderReto(reto.id, (reto.indiceCorrecta + 1) % reto.opciones.length)).toBe(false);
    expect((await g.cargar()).retosCorrectosIds).toHaveLength(0);
  });
});

describe('álbum', () => {
  it('tiene 11 cartas y cada una tiene al menos un fragmento del guion que la respalda', () => {
    const g = gestor();
    expect(g.coleccionables()).toHaveLength(11);
    for (const c of g.coleccionables()) {
      expect(g.fragmentosDeCarta(c).length).toBeGreaterThan(0);
    }
  });
});
