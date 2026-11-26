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
 * (`COLECCIONABLES_ESPECIE`) para armar la cuadrícula 3×n de la estación.
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
    if (carta.nombreCientifico) {
      porCientificoCarta.set(normalizarNombre(carta.nombreCientifico), carta);
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

    resultado.push({
      clave: carta?.id ?? claveNorm,
      nombreComun: carta?.nombre ?? cat?.nombreComun ?? null,
      nombreCientifico: cat?.nombreCientifico ?? cientifico,
      grupo: cat?.grupo ?? null,
      rutaImagen: normalizarRutaEspecie(cat?.foto ?? carta?.imagen ?? null),
      rutaMiniatura:
        carta?.imagenMini
          ? normalizarRutaEspecie(carta.imagenMini)
          : miniaturaDeArchivo(cat?.foto ?? null),
      categoriaAmenaza: amenaza,
      credito: cat?.credito ?? carta?.credito ?? null,
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
    resultado.push({
      clave: carta?.id ?? `gbif-${cat.gbifKey}`,
      nombreComun: carta?.nombre ?? cat.nombreComun,
      nombreCientifico: cat.nombreCientifico,
      grupo: cat.grupo,
      rutaImagen: normalizarRutaEspecie(cat.foto ?? carta?.imagen ?? null),
      rutaMiniatura: miniaturaDeArchivo(cat.foto ?? carta?.imagenMini ?? null),
      categoriaAmenaza: amenaza,
      credito: cat.credito ?? carta?.credito ?? null,
      fragmentoIds: carta?.fragmentoIds ?? [],
      ocultarUbicacion: debeOcultarUbicacion(amenaza),
    });
  }

  // 3. Cartas especiales asociadas a la estación (respaldo incluso antes de S2).
  for (const carta of cartas) {
    if (carta.estacionId !== estacion.id) continue;
    const claveNorm = carta.nombreCientifico ? normalizarNombre(carta.nombreCientifico) : carta.id;
    if (agregadas.has(claveNorm)) continue;
    agregadas.add(claveNorm);

    const cat = carta.nombreCientifico ? porCientificoCat.get(claveNorm) : undefined;
    const amenaza = cat?.categoriaAmenaza ?? carta.categoriaAmenaza;
    resultado.push({
      clave: carta.id,
      nombreComun: carta.nombre,
      nombreCientifico: carta.nombreCientifico ?? null,
      grupo: cat?.grupo ?? null,
      rutaImagen: normalizarRutaEspecie(cat?.foto ?? carta.imagen),
      rutaMiniatura: normalizarRutaEspecie(carta.imagenMini),
      categoriaAmenaza: amenaza,
      credito: cat?.credito ?? carta.credito,
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
  const seleccionados: Fragmento[] = [];

  for (const id of especie.fragmentoIds) {
    for (const f of aptos) {
      if (f.id === id || f.id.startsWith(`${id}-`)) {
        if (!seleccionados.includes(f)) seleccionados.push(f);
      }
    }
  }

  if (seleccionados.length === 0) {
    const terminos = [especie.nombreCientifico, especie.nombreComun]
      .filter((t): t is string => Boolean(t && t.trim()))
      .map((t) => t.toLowerCase());
    for (const f of aptos) {
      const texto = `${f.titulo} ${f.texto}`.toLowerCase();
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
