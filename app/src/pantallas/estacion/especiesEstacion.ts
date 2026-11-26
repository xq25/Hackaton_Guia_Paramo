import {
  COLECCIONABLES_ESPECIE,
  CategoriaAmenaza,
  OCULTAR_UBICACION,
  type Coleccionable,
  type CreditoImagen,
  type EspecieCatalogo,
  type Estacion,
  type Fragmento,
  type Guion,
} from '../../dominio/modelo';

/** Vista unificada de una especie en la cuadrícula de estación y en la ficha de detalle. */
export interface EspecieVista {
  clave: string;
  nombreComun: string | null;
  nombreCientifico: string | null;
  grupo: EspecieCatalogo['grupo'] | null;
  rutaImagen: string | null;
  rutaMiniatura: string | null;
  categoriaAmenaza: CategoriaAmenaza | null;
  credito: CreditoImagen | null;
  fragmentoIds: string[];
  ocultarUbicacion: boolean;
}

/** Equivalencias científicas para las cartas de modelo.ts que no traen nombreCientifico. */
const CIENTIFICO_POR_CARTA: Record<string, string> = {
  frailejon: 'Espeletia hartwegiana',
  pajonal: 'Paramochloa effusa',
  coral_paramo: 'Andicolea colombiana',
  condor: 'Vultur gryphus',
  danta: 'Tapirus pinchaque',
  periquito: 'Bolborhynchus ferrugineifrons',
};

const NOMBRES_UICN: Record<CategoriaAmenaza, string> = {
  [CategoriaAmenaza.CR]: 'En peligro crítico (CR)',
  [CategoriaAmenaza.EN]: 'En peligro (EN)',
  [CategoriaAmenaza.VU]: 'Vulnerable (VU)',
  [CategoriaAmenaza.NT]: 'Casi amenazada (NT)',
  [CategoriaAmenaza.LC]: 'Preocupación menor (LC)',
  [CategoriaAmenaza.NE]: 'No evaluada (NE)',
};

export function describirAmenazaUicn(cat: CategoriaAmenaza | null): string | null {
  if (!cat) return null;
  return `${NOMBRES_UICN[cat]} · Fuente: GBIF`;
}

export function debeOcultarUbicacion(cat: CategoriaAmenaza | null): boolean {
  return cat !== null && OCULTAR_UBICACION.includes(cat);
}

function normalizarNombre(s: string): string {
  return s.trim().toLowerCase();
}

function normalizarRutaEspecie(archivo: string | null): string | null {
  if (!archivo) return null;
  return archivo.includes('/') ? archivo : `especies/${archivo}`;
}

function miniaturaDeArchivo(archivo: string | null): string | null {
  if (!archivo) return null;
  const base = archivo.includes('/') ? archivo : `especies/${archivo}`;
  return base.endsWith('.webp') && !base.endsWith('_mini.webp')
    ? base.replace(/\.webp$/, '_mini.webp')
    : base;
}

/**
 * Cruza `Estacion.especies`, `catalogo` (GBIF/iNaturalist) y las cartas especiales
 * (`COLECCIONABLES_ESPECIE`) para armar la cuadrícula 3×n de la estación sin duplicados.
 */
export function construirEspeciesEstacion(
  estacion: Estacion,
  catalogo: EspecieCatalogo[],
  cartas: Coleccionable[] = COLECCIONABLES_ESPECIE
): EspecieVista[] {
  const porCientificoCat = new Map<string, EspecieCatalogo>();
  for (const c of catalogo) {
    porCientificoCat.set(normalizarNombre(c.nombreCientifico), c);
  }

  const porCientificoCarta = new Map<string, Coleccionable>();
  for (const carta of cartas) {
    const cient = carta.nombreCientifico ?? CIENTIFICO_POR_CARTA[carta.id];
    if (cient) {
      porCientificoCarta.set(normalizarNombre(cient), carta);
    }
  }

  const resultado: EspecieVista[] = [];
  const agregadas = new Set<string>();

  // 1. Especies declaradas en Estacion.especies (nombres científicos de las tablas del guion).
  for (const cientifico of estacion.especies) {
    const claveNorm = normalizarNombre(cientifico);
    if (!claveNorm || agregadas.has(claveNorm)) continue;
    agregadas.add(claveNorm);

    const cat = porCientificoCat.get(claveNorm);
    const carta = porCientificoCarta.get(claveNorm);
    const amenaza = cat?.categoriaAmenaza ?? carta?.categoriaAmenaza ?? null;
    const credito = cat?.credito ?? carta?.credito ?? null;

    resultado.push({
      clave: carta?.id ?? claveNorm,
      nombreComun: carta?.nombre ?? cat?.nombreComun ?? null,
      nombreCientifico: cat?.nombreCientifico ?? cientifico,
      grupo: cat?.grupo ?? null,
      // Regla 9: la fotografía externa solo se muestra si cuenta con crédito de atribución.
      rutaImagen: credito ? normalizarRutaEspecie(cat?.foto ?? carta?.imagen ?? null) : null,
      rutaMiniatura: credito
        ? carta?.imagenMini
          ? normalizarRutaEspecie(carta.imagenMini)
          : miniaturaDeArchivo(cat?.foto ?? null)
        : null,
      categoriaAmenaza: amenaza,
      credito,
      fragmentoIds: carta?.fragmentoIds ?? [],
      ocultarUbicacion: debeOcultarUbicacion(amenaza),
    });
  }

  // 2. Especies del catálogo marcadas con esta estación que no vinieran ya en la lista.
  for (const cat of catalogo) {
    if (!cat.estacionIds.includes(estacion.id)) continue;
    const claveNorm = normalizarNombre(cat.nombreCientifico);
    if (agregadas.has(claveNorm)) continue;
    agregadas.add(claveNorm);

    const carta = porCientificoCarta.get(claveNorm);
    const amenaza = cat.categoriaAmenaza ?? carta?.categoriaAmenaza ?? null;
    const credito = cat.credito ?? carta?.credito ?? null;
    resultado.push({
      clave: carta?.id ?? `gbif-${cat.gbifKey}`,
      nombreComun: carta?.nombre ?? cat.nombreComun,
      nombreCientifico: cat.nombreCientifico,
      grupo: cat.grupo,
      rutaImagen: credito ? normalizarRutaEspecie(cat.foto ?? carta?.imagen ?? null) : null,
      rutaMiniatura: credito ? miniaturaDeArchivo(cat.foto ?? carta?.imagenMini ?? null) : null,
      categoriaAmenaza: amenaza,
      credito,
      fragmentoIds: carta?.fragmentoIds ?? [],
      ocultarUbicacion: debeOcultarUbicacion(amenaza),
    });
  }

  // 3. Cartas especiales asociadas a la estación (sin duplicar si ya entraron por nombre científico).
  for (const carta of cartas) {
    if (carta.estacionId !== estacion.id) continue;
    const cient = carta.nombreCientifico ?? CIENTIFICO_POR_CARTA[carta.id] ?? null;
    const claveNorm = cient ? normalizarNombre(cient) : carta.id;
    if (agregadas.has(claveNorm)) continue;
    agregadas.add(claveNorm);

    const cat = cient ? porCientificoCat.get(claveNorm) : undefined;
    const amenaza = cat?.categoriaAmenaza ?? carta.categoriaAmenaza;
    const credito = cat?.credito ?? carta.credito;
    resultado.push({
      clave: carta.id,
      nombreComun: carta.nombre,
      nombreCientifico: cient,
      grupo: cat?.grupo ?? null,
      rutaImagen: credito ? normalizarRutaEspecie(cat?.foto ?? carta.imagen) : null,
      rutaMiniatura: credito ? normalizarRutaEspecie(carta.imagenMini) : null,
      categoriaAmenaza: amenaza,
      credito,
      fragmentoIds: carta.fragmentoIds,
      ocultarUbicacion: debeOcultarUbicacion(amenaza),
    });
  }

  return resultado;
}

export interface FragmentoCitado {
  fragmento: Fragmento;
  citaTexto: string;
}

export function formatearCitaFragmento(
  fragmento: Fragmento,
  guiones: Guion[],
  estacionNombre?: string | null
): string {
  const guion = guiones.find((g) => g.id === fragmento.guionId);
  const titulo = guion?.titulo ?? fragmento.guionId;
  const partes = [titulo, `p. ${fragmento.pagina}`];
  if (estacionNombre) partes.push(estacionNombre);
  return partes.join(' · ');
}

/** Busca fragmentos aptos del guion que describen las características de la especie. */
export function buscarCaracteristicasEspecie(
  especie: EspecieVista,
  fragmentos: Fragmento[],
  guiones: Guion[]
): FragmentoCitado[] {
  const aptos = fragmentos.filter((f) => f.apto);
  const terminos = [especie.nombreCientifico, especie.nombreComun]
    .filter((t): t is string => Boolean(t && t.trim()))
    .map((t) =>
      t
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
    );

  const sinTildes = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

  const seleccionados: Fragmento[] = [];

  for (const id of especie.fragmentoIds) {
    const exacto = aptos.find((f) => f.id === id);
    if (exacto) {
      if (!seleccionados.includes(exacto)) seleccionados.push(exacto);
      continue;
    }
    const dePagina = aptos.filter((f) => f.id.startsWith(`${id}-`));
    const conTermino = dePagina.filter((f) =>
      terminos.some((t) => sinTildes(`${f.titulo} ${f.texto}`).includes(t))
    );
    for (const f of conTermino.length > 0 ? conTermino : dePagina.slice(0, 1)) {
      if (!seleccionados.includes(f)) seleccionados.push(f);
    }
  }

  if (seleccionados.length === 0 && terminos.length > 0) {
    for (const f of aptos) {
      const texto = sinTildes(`${f.titulo} ${f.texto}`);
      if (terminos.some((t) => texto.includes(t))) {
        seleccionados.push(f);
        if (seleccionados.length >= 2) break;
      }
    }
  }

  return seleccionados.slice(0, 2).map((fragmento) => ({
    fragmento,
    citaTexto: formatearCitaFragmento(fragmento, guiones),
  }));
}
