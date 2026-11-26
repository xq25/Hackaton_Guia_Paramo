/**
 * Reglas del juego (Dev A). Sin React ni dependencias: se prueba con Jest y un Almacen falso.
 * Docs: docs/04-juego.md. Por ahora las llegadas solo se registran en modo demo (D20).
 */
import {
  COLECCIONABLES_ESPECIE, INSIGNIAS, TipoColeccionable,
  type Almacen, type Coleccionable, type CriterioInsignia, type EspecieCatalogo, type Estacion, type Fragmento, type GestorProgreso,
  type Insignia, type MetodoRegistro, type PaqueteContenido, type ProgresoLocal,
} from '../dominio/modelo';

export const CLAVE_PROGRESO = 'progreso.v1';

export interface ResultadoVisita {
  nueva: boolean;                 // false si ya hubo visita hoy en esa estación
  coleccionables: Coleccionable[];
  insignias: Insignia[];
}

/** Lo que C usa: GestorProgreso + consultas de solo lectura para pintar mapa, panel y álbum. */
export interface ProgresoJuego extends GestorProgreso {
  paquete: PaqueteContenido;
  coleccionables(): Coleccionable[];          // Las 11 cartas del álbum (5 estaciones + 6 especies)
  insignias(): Insignia[];
  fragmento(id: string): Fragmento | undefined;
  /** Fragmentos que respaldan el texto de una carta (resuelve las referencias por página de modelo.ts). */
  fragmentosDeCarta(carta: Coleccionable): Fragmento[];
  /** Entrada del catálogo de una carta de especie (para foto, crédito y categoría UICN). */
  especieDeCarta(carta: Coleccionable, catalogo: EspecieCatalogo[]): EspecieCatalogo | undefined;
  estacionVisitada(progreso: ProgresoLocal, estacionId: string): boolean;
  /** Especie de la cuadrícula de una estación: se desbloquea al visitar cualquier estación que la tenga. */
  especieDesbloqueada(progreso: ProgresoLocal, nombreCientifico: string): boolean;
}

const VACIO: ProgresoLocal = { visitas: [], coleccionablesIds: [], insigniasIds: [], retosCorrectosIds: [] };

/** Día local en formato AAAA-MM-DD (sin hora: no se guarda la hora exacta). */
export function diaLocal(fecha = new Date()): string {
  const dd = (n: number) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${dd(fecha.getMonth() + 1)}-${dd(fecha.getDate())}`;
}

/** Cartas de estación: una por parada, con el primer fragmento base de esa estación. */
export function cartasEstacion(paquete: PaqueteContenido): Coleccionable[] {
  return paquete.estaciones.map((e: Estacion) => ({
    id: `estacion_${e.id}`,
    tipo: TipoColeccionable.ESTACION,
    nombre: e.nombre,
    estacionId: e.id,
    fragmentoIds: paquete.fragmentos.filter(f => f.estacionId === e.id && f.apto).slice(0, 2).map(f => f.id),
    imagen: e.imagen,
    imagenMini: e.imagen.replace(/\.webp$/, '_mini.webp'),
    credito: null,
    categoriaAmenaza: null,
    requisito: { estacionId: e.id, visitasMinimas: 1 },
  }));
}

/**
 * Especie del catálogo de cada carta (algunas cartas de modelo.ts no traen nombreCientifico).
 * Mantener igual a CARTAS en scripts/generar_catalogo.py.
 */
export const CIENTIFICO_CARTA: Record<string, string> = {
  frailejon: 'Espeletia hartwegiana',
  pajonal: 'Paramochloa effusa',
  coral_paramo: 'Andicolea colombiana',
  condor: 'Vultur gryphus',
  danta: 'Tapirus pinchaque',
  periquito: 'Bolborhynchus ferrugineifrons',
};

/** Términos extra con que el guion nombra a cada especie de carta. */
const ALIAS_CARTA: Record<string, string[]> = {
  frailejon: ['frailejon', 'espeletia'],
  pajonal: ['pajonal'],
  coral_paramo: ['coral de paramo', 'loricaria'],
  condor: ['condor'],
  danta: ['danta', 'tapir'],
  periquito: ['periquito', 'bolborhynchus'],
};

const sinTildes = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * Las cartas de especie en modelo.ts citan páginas ('uton2024-p5'), no ids de fragmento.
 * Se resuelven a los fragmentos aptos de esa página que nombran la especie.
 */
export function resolverFragmentosCarta(carta: Coleccionable, paquete: PaqueteContenido): Fragmento[] {
  const terminos = ALIAS_CARTA[carta.id] ?? [sinTildes(carta.nombre)];
  const salida: Fragmento[] = [];
  for (const ref of carta.fragmentoIds) {
    const exacto = paquete.fragmentos.find(f => f.id === ref);
    const candidatos = exacto ? [exacto] : paquete.fragmentos.filter(f => f.apto && f.id.startsWith(`${ref}-`));
    const conNombre = candidatos.filter(f => terminos.some(t => sinTildes(f.texto).includes(t)));
    for (const f of exacto ? candidatos : conNombre) if (!salida.includes(f)) salida.push(f);
  }
  return salida;
}

function diasEn(progreso: ProgresoLocal, estacionId: string): number {
  return new Set(progreso.visitas.filter(v => v.estacionId === estacionId).map(v => v.dia)).size;
}

function recorridosCompletos(progreso: ProgresoLocal, estacionIds: string[]): number {
  const porDia = new Map<string, Set<string>>();
  for (const v of progreso.visitas) {
    if (!porDia.has(v.dia)) porDia.set(v.dia, new Set());
    porDia.get(v.dia)!.add(v.estacionId);
  }
  return [...porDia.values()].filter(s => estacionIds.every(id => s.has(id))).length;
}

export function cumpleCriterio(c: CriterioInsignia, progreso: ProgresoLocal, estacionIds: string[]): boolean {
  switch (c.tipo) {
    case 'visitas_estacion': return diasEn(progreso, c.estacionId) >= c.veces;
    case 'recorrido_completo': return recorridosCompletos(progreso, estacionIds) >= c.veces;
    case 'retos_correctos': return progreso.retosCorrectosIds.length >= c.cantidad;
    case 'coleccion': return c.coleccionableIds.every(id => progreso.coleccionablesIds.includes(id));
  }
}

function cumpleRequisito(col: Coleccionable, progreso: ProgresoLocal): boolean {
  const r = col.requisito;
  return 'insigniaId' in r ? progreso.insigniasIds.includes(r.insigniaId) : diasEn(progreso, r.estacionId) >= r.visitasMinimas;
}

/** Recalcula insignias y cartas; repite hasta estabilizar (una carta puede pedir una insignia). Devuelve lo nuevo. */
export function recalcular(progreso: ProgresoLocal, cartas: Coleccionable[], estacionIds: string[]) {
  const nuevasInsignias: Insignia[] = [];
  const nuevasCartas: Coleccionable[] = [];
  let cambio = true;
  while (cambio) {
    cambio = false;
    for (const i of INSIGNIAS) {
      if (!progreso.insigniasIds.includes(i.id) && cumpleCriterio(i.criterio, progreso, estacionIds)) {
        progreso.insigniasIds.push(i.id);
        nuevasInsignias.push(i);
        cambio = true;
      }
    }
    for (const c of cartas) {
      if (!progreso.coleccionablesIds.includes(c.id) && cumpleRequisito(c, progreso)) {
        progreso.coleccionablesIds.push(c.id);
        nuevasCartas.push(c);
        cambio = true;
      }
    }
  }
  return { insignias: nuevasInsignias, coleccionables: nuevasCartas };
}

export function crearGestorProgreso(deps: {
  paquete: PaqueteContenido;
  almacen: Almacen;
  hoy?: () => string;             // Para tests
}): ProgresoJuego {
  const { paquete, almacen } = deps;
  const hoy = deps.hoy ?? (() => diaLocal());
  const cartas = [...cartasEstacion(paquete), ...COLECCIONABLES_ESPECIE];
  const estacionIds = paquete.estaciones.map(e => e.id);
  const fragmentos = new Map(paquete.fragmentos.map(f => [f.id, f]));

  const leer = (): ProgresoLocal => {
    try {
      const crudo = almacen.leer(CLAVE_PROGRESO);
      return crudo ? { ...VACIO, ...JSON.parse(crudo) } : structuredCopy(VACIO);
    } catch {
      return structuredCopy(VACIO);  // Dato corrupto: se empieza de cero en vez de romper la app
    }
  };
  const guardar = (p: ProgresoLocal) => almacen.escribir(CLAVE_PROGRESO, JSON.stringify(p));

  return {
    paquete,
    async cargar() {
      return leer();
    },
    async registrarVisita(estacionId: string, metodo: MetodoRegistro): Promise<ResultadoVisita> {
      if (!estacionIds.includes(estacionId)) throw new Error(`Estación desconocida: ${estacionId}`);
      const progreso = leer();
      const dia = hoy();
      if (progreso.visitas.some(v => v.estacionId === estacionId && v.dia === dia)) {
        return { nueva: false, coleccionables: [], insignias: [] };
      }
      progreso.visitas.push({ estacionId, dia, metodo });
      const nuevos = recalcular(progreso, cartas, estacionIds);
      guardar(progreso);
      return { nueva: true, ...nuevos };
    },
    async responderReto(retoId: string, indice: number) {
      const reto = paquete.retos.find(r => r.id === retoId);
      if (!reto) return false;
      const correcto = reto.indiceCorrecta === indice;
      if (correcto) {
        const progreso = leer();
        if (!progreso.retosCorrectosIds.includes(retoId)) {
          progreso.retosCorrectosIds.push(retoId);
          recalcular(progreso, cartas, estacionIds);
          guardar(progreso);
        }
      }
      return correcto;
    },
    async reiniciar() {
      almacen.borrar(CLAVE_PROGRESO);
    },
    coleccionables: () => cartas,
    insignias: () => INSIGNIAS,
    fragmento: (id: string) => fragmentos.get(id),
    fragmentosDeCarta: (carta: Coleccionable) => resolverFragmentosCarta(carta, paquete),
    especieDeCarta: (carta, catalogo) => {
      const nombre = carta.nombreCientifico ?? CIENTIFICO_CARTA[carta.id];
      return nombre ? catalogo.find(e => e.nombreCientifico === nombre) : undefined;
    },
    estacionVisitada: (progreso, estacionId) => progreso.visitas.some(v => v.estacionId === estacionId),
    especieDesbloqueada: (progreso, nombreCientifico) =>
      paquete.estaciones.some(e => e.especies.includes(nombreCientifico) && progreso.visitas.some(v => v.estacionId === e.id)),
  };
}

function structuredCopy(p: ProgresoLocal): ProgresoLocal {
  return { visitas: [...p.visitas], coleccionablesIds: [...p.coleccionablesIds], insigniasIds: [...p.insigniasIds], retosCorrectosIds: [...p.retosCorrectosIds] };
}
