/**
 * Búsqueda local con MiniSearch sobre los fragmentos aptos del guion.
 * - Campos: titulo, texto, palabrasClave (boost a título y palabras clave).
 * - Difusa y por prefijo, para errores de ortografía ("frailejom").
 * - Impulso a los fragmentos de la estación actual, y más aún a la estación que se nombra en la
 *   pregunta ("¿por qué las piedras del Valle Lunar son rojas?" desde cualquier parada).
 * - Palabras vacías fuera: si no, "que", "el", "de"… dan evidencia falsa.
 */
import MiniSearch from 'minisearch';
import type { Consulta, Estacion, Fragmento, MotorBusqueda, ResultadoBusqueda } from '../dominio/modelo';
import { normalizarTexto } from './normalizador';

const BOOST_CAMPOS = { titulo: 2, palabrasClave: 3, texto: 1 };
const BOOST_ESTACION = 1.5;
const BOOST_ESTACION_NOMBRADA = 2;

const PALABRAS_VACIAS = new Set(
  ('a al algo como con cual cuales cuando de del donde el ella ellos en es esa ese eso esta estas este '
  + 'esto estos fue hay la las le les lo los me mi mis muy nos o para pero por porque que quien se ser '
  + 'si sin son su sus te tu un una uno unos unas y ya hace tiene tienen puede pueden aqui alli hoy '
  + 'sobre entre tambien mas menos cada todo todos toda todas otro otra otros otras usted ustedes').split(' '),
);

/** Un término de MiniSearch: normalizado y sin palabras vacías (null = se descarta). */
export function procesarTermino(termino: string): string | null {
  const t = normalizarTexto(termino);
  // (una abreviatura puede expandirse a dos palabras, p. ej. "xq" → "por que": se descarta)
  return t.length > 1 && !t.includes(' ') && !PALABRAS_VACIAS.has(t) ? t : null;
}

/** Resultado con los términos de la pregunta que encontró (lo usa el evaluador de evidencia). */
export interface ResultadoConTerminos extends ResultadoBusqueda {
  terminos: string[];
}

/** id de la estación cuyo nombre o alias aparece en el texto normalizado (el más largo gana). */
function estacionNombrada(texto: string, estaciones: Estacion[]): string | null {
  const conEspacios = ` ${texto} `;
  const nombres = estaciones
    .flatMap(e => [e.nombre, ...e.alias].map(n => [normalizarTexto(n), e.id] as const))
    .sort((a, b) => b[0].length - a[0].length);
  return nombres.find(([n]) => n && conEspacios.includes(` ${n} `))?.[1] ?? null;
}

export function crearMotorBusqueda(estaciones: Estacion[] = []): MotorBusqueda {
  let indice: MiniSearch<Fragmento> | null = null;
  let porId = new Map<string, Fragmento>();

  return {
    indexar(fragmentos: Fragmento[]): void {
      const aptos = (fragmentos ?? []).filter(f => f.apto);
      porId = new Map(aptos.map(f => [f.id, f]));
      indice = new MiniSearch<Fragmento>({
        idField: 'id',
        fields: ['titulo', 'texto', 'palabrasClave'],
        extractField: (doc, campo) => {
          const valor = (doc as unknown as Record<string, unknown>)[campo];
          return Array.isArray(valor) ? valor.join(' ') : String(valor ?? '');
        },
        processTerm: procesarTermino,
      });
      indice.addAll(aptos);
    },

    buscar(consulta: Consulta, limite: number): ResultadoBusqueda[] {
      if (!indice || !consulta.textoNormalizado.trim()) return [];
      const nombrada = estacionNombrada(consulta.textoNormalizado, estaciones);
      const impulso = (id: string): number => {
        const estacionId = porId.get(id)?.estacionId;
        if (!estacionId) return 1;
        if (estacionId === nombrada) return BOOST_ESTACION_NOMBRADA;
        return !nombrada && estacionId === consulta.estacionId ? BOOST_ESTACION : 1;
      };
      return indice
        .search(consulta.textoNormalizado, {
          boost: BOOST_CAMPOS,
          fuzzy: termino => (termino.length > 4 ? 0.2 : false),
          prefix: termino => termino.length > 3,
          combineWith: 'OR',
          boostDocument: id => impulso(String(id)),
        })
        .slice(0, limite)
        .flatMap((r): ResultadoConTerminos[] => {
          const fragmento = porId.get(String(r.id));
          return fragmento ? [{ fragmento, puntaje: r.score, terminos: r.queryTerms }] : [];
        });
    },
  };
}
