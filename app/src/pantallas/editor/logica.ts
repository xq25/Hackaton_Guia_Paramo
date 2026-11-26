/**
 * Lógica del editor de fichas, sin React (se prueba con Jest).
 * Textos para el personal del parque: lenguaje llano, sin términos técnicos.
 */
import {
  EstadoFicha,
  Naturaleza,
  Tema,
  TipoRespuesta,
  type FichaContenido,
  type Fragmento,
} from '../../dominio/modelo';

/** "Tipo" del formulario, en lenguaje llano. */
export const TIPOS: { valor: Naturaleza; etiqueta: string }[] = [
  { valor: Naturaleza.CIENTIFICO, etiqueta: 'Dato científico' },
  { valor: Naturaleza.TRADICION_ORAL, etiqueta: 'Tradición oral' },
  { valor: Naturaleza.NORMA, etiqueta: 'Norma del recorrido' },
  { valor: Naturaleza.SEGURIDAD, etiqueta: 'Seguridad' },
  { valor: Naturaleza.DATO_FECHADO, etiqueta: 'Dato con fecha' },
];

/** Temas editables (salud de altura no se edita desde aquí). */
export const TEMAS: { valor: Tema; etiqueta: string }[] = [
  { valor: Tema.ESTACION, etiqueta: 'Estación' },
  { valor: Tema.INTRODUCCION, etiqueta: 'Introducción' },
  { valor: Tema.GLOSARIO, etiqueta: 'Glosario' },
  { valor: Tema.GEOLOGIA, etiqueta: 'Geología' },
  { valor: Tema.GLACIOLOGIA, etiqueta: 'Glaciares' },
  { valor: Tema.CULTURA, etiqueta: 'Cultura' },
  { valor: Tema.BIOLOGIA, etiqueta: 'Flora y fauna' },
  { valor: Tema.CLIMA, etiqueta: 'Clima' },
  { valor: Tema.BUENAS_PRACTICAS, etiqueta: 'Buenas prácticas' },
];

export const ESTADOS: Record<EstadoFicha, string> = {
  [EstadoFicha.BORRADOR]: 'Borrador',
  [EstadoFicha.APROBADA]: 'Publicada',
  [EstadoFicha.RETIRADA]: 'Retirada',
};

export const TIPOS_RESPUESTA: Record<TipoRespuesta, string> = {
  [TipoRespuesta.RESPONDIDA]: 'Respondida con el guion',
  [TipoRespuesta.CON_DIFERENCIA_ENTRE_FUENTES]: 'Las fuentes no coinciden',
  [TipoRespuesta.ABSTENCION]: 'No está en el guion',
  [TipoRespuesta.REMISION_AL_PERSONAL]: 'Remite al guía o al personal',
  [TipoRespuesta.RESPALDO_SIN_MODELO]: 'Texto del guion (sin el modelo)',
};

export const hoy = () => new Date().toISOString().slice(0, 10);

let contadorIds = 0;
export function generarId(ahora = Date.now()): string {
  contadorIds = (contadorIds + 1) % 1296;
  const azar = Math.floor(Math.random() * 36 ** 4).toString(36).padStart(4, '0');
  return `ficha-${ahora.toString(36)}${contadorIds.toString(36).padStart(2, '0')}${azar}`;
}

/** Ficha vacía, o prellenada desde un fragmento del guion (para corregirlo: lo reemplaza). */
export function fichaNueva(desde?: Fragmento): FichaContenido {
  return {
    id: generarId(),
    titulo: desde?.titulo ?? '',
    estacionId: desde?.estacionId ?? null,
    tema: desde?.tema ?? Tema.ESTACION,
    naturaleza: desde?.naturaleza ?? Naturaleza.CIENTIFICO,
    texto: desde?.texto ?? '',
    fuente: desde && desde.origen === 'guion'
      ? { guionId: desde.guionId, pagina: desde.pagina }
      : { documento: '' },
    version: 0,
    estado: EstadoFicha.BORRADOR,
    aprobadaPor: '',
    fechaRevision: hoy(),
    reemplazaFragmentoIds: desde && desde.origen === 'guion' ? [desde.id] : [],
  };
}

const normalizar = (t: string) =>
  t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

/** Busca por texto (título, texto, palabras clave) y estación; sin tildes ni mayúsculas. */
export function filtrarFragmentos(
  fragmentos: Fragmento[],
  texto: string,
  estacionId: string | null | 'todas',
): Fragmento[] {
  const palabras = normalizar(texto).split(/\s+/).filter(Boolean);
  return fragmentos.filter(f => {
    if (estacionId !== 'todas' && f.estacionId !== estacionId) return false;
    const contenido = normalizar(`${f.titulo} ${f.texto} ${f.palabrasClave.join(' ')}`);
    return palabras.every(p => contenido.includes(p));
  });
}

export type Campo =
  | 'titulo' | 'texto' | 'estacionId' | 'tema' | 'naturaleza' | 'fuente' | 'aprobadaPor' | 'general';

/** Reparte los mensajes de validar() junto al campo que corresponde. */
export function erroresPorCampo(errores: string[]): Partial<Record<Campo, string[]>> {
  const reglas: [RegExp, Campo][] = [
    [/título/i, 'titulo'],
    [/texto/i, 'texto'],
    [/estación/i, 'estacionId'],
    [/tema|salud de altura/i, 'tema'],
    [/tipo de contenido/i, 'naturaleza'],
    [/página|documento|guion/i, 'fuente'],
    [/revisó|cargo/i, 'aprobadaPor'],
  ];
  const salida: Partial<Record<Campo, string[]>> = {};
  for (const error of errores) {
    const campo = reglas.find(([patron]) => patron.test(error))?.[1] ?? 'general';
    (salida[campo] ??= []).push(error);
  }
  return salida;
}

/** Página escrita en el formulario → número, o undefined si está vacía o no es un número. */
export function leerPagina(texto: string): number | undefined {
  const n = Number(texto.trim());
  return texto.trim() !== '' && Number.isFinite(n) ? n : undefined;
}

/** "fichas-2026-11-26.json" */
export const nombreArchivoExportacion = (fecha = hoy()) => `fichas-${fecha}.json`;
