/**
 * Normaliza la pregunta del visitante: minúsculas, sin tildes, sin signos, abreviaturas
 * comunes y sinónimos del paquete.
 *
 * Los sinónimos se AGREGAN al final (no reemplazan): "piedras rojas" → "piedras rojas rocas rojizo".
 * Así el filtro de seguridad ve las palabras originales y la búsqueda también encuentra el término
 * canónico del guion.
 */
import type { Consulta, Nivel, NormalizadorConsulta, Sinonimo } from '../dominio/modelo';

/** Abreviaturas y errores frecuentes al escribir en el celular. */
const ABREVIATURAS: Record<string, string> = {
  q: 'que', k: 'que', xq: 'por que', pq: 'por que', porq: 'por que', porque: 'por que',
  tb: 'tambien', tmb: 'tambien', d: 'de', x: 'por',
};

/** Minúsculas, sin tildes (ñ → n), sin signos, espacios simples. */
export function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map(p => ABREVIATURAS[p] ?? p)
    .join(' ');
}

export function crearNormalizador(sinonimos: Sinonimo[]): NormalizadorConsulta {
  // equivalente normalizado → término canónico normalizado; los más largos primero ("valle lunar")
  const pares = sinonimos
    .flatMap(s => s.equivalentes.map(eq => [normalizarTexto(eq), normalizarTexto(s.termino)] as const))
    .filter(([eq]) => eq.length > 0)
    .sort((a, b) => b[0].length - a[0].length);

  return {
    normalizar(texto: string, estacionId: string | null, nivel: Nivel): Consulta {
      const base = normalizarTexto(texto);
      const conEspacios = ` ${base} `;
      const extra = new Set<string>();
      for (const [eq, termino] of pares) {
        if (conEspacios.includes(` ${eq} `) && !conEspacios.includes(` ${termino} `)) extra.add(termino);
      }
      return {
        textoOriginal: texto,
        textoNormalizado: [base, ...extra].join(' ').trim(),
        estacionId,
        nivel,
      };
    },
  };
}
