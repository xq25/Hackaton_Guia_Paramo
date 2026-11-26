/**
 * Normaliza la pregunta del visitante: minúsculas, sin tildes, sin signos, abreviaturas
 * comunes, corrección de errores de ortografía contra el vocabulario del páramo, y sinónimos.
 *
 * Lo que se agrega va AL FINAL (no reemplaza): "piedras rojas" → "piedras rojas roca oxidacion".
 * Así el filtro de seguridad ve las palabras originales y la búsqueda también encuentra el término
 * canónico del guion.
 */
import type { Consulta, Nivel, NormalizadorConsulta, PaqueteContenido, Sinonimo } from '../dominio/modelo';

/** Abreviaturas y errores frecuentes al escribir en el celular. */
const ABREVIATURAS: Record<string, string> = {
  q: 'que', k: 'que', xq: 'por que', pq: 'por que', porq: 'por que', porque: 'por que',
  tb: 'tambien', tmb: 'tambien', d: 'de', x: 'por',
};

/** Solo se corrigen palabras largas: en las cortas, una letra cambia el sentido ("arepa" ≠ "arena"). */
const LARGO_MINIMO_CORRECCION = 7;

/**
 * No son vocabulario del páramo: palabras de plantilla de los guiones (encabezados) y palabras
 * genéricas que aparecen dentro de nombres propios ("Parque Nacional", "Río Negro").
 */
const PALABRAS_PLANTILLA = new Set([
  'concepto', 'clave', 'importancia', 'caracteristicas', 'unicas', 'discurso', 'sugerido', 'parada',
  'dato', 'curioso', 'glosario', 'sector', 'estacion',
  'parque', 'parques', 'nacional', 'natural', 'negro', 'blanco', 'grande', 'nuevo', 'nueva', 'santa',
  'norte', 'colombia', 'mundo',
]);

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

const cacheVocabulario = new WeakMap<PaqueteContenido, Set<string>>();

/**
 * Vocabulario del páramo: sinónimos, glosario, estaciones, especies y nombres propios del guion
 * (palabras con mayúscula a mitad de frase: Armero, Quimbayas, Ezpeleta…). Palabras de 4+ letras.
 * Sirve para corregir la ortografía y para decidir si una sola palabra en común es evidencia.
 */
export function vocabularioDominio(paquete: PaqueteContenido): Set<string> {
  const guardado = cacheVocabulario.get(paquete);
  if (guardado) return guardado;

  const fuentes: string[] = [
    ...(paquete.sinonimos ?? []).flatMap(s => [s.termino, ...s.equivalentes]),
    ...(paquete.glosario ?? []).map(g => g.termino),
    ...(paquete.estaciones ?? []).flatMap(e => [e.nombre, ...e.alias, ...e.especies]),
  ];
  // Nombre propio = va con mayúscula a mitad de frase en la mayoría de sus apariciones
  // (Armero sí; "Parque Nacional" o "Río Negro" no convierten en vocabulario a parque o negro).
  const conMayuscula = new Map<string, number>();
  const apariciones = new Map<string, number>();
  for (const f of paquete.fragmentos ?? []) {
    if (!f.apto) continue;
    for (const m of f.texto.matchAll(/[a-záéíóúñ,] ([A-ZÁÉÍÓÚÑ][a-záéíóúñ]{3,})/g)) {
      const t = normalizarTexto(m[1]);
      conMayuscula.set(t, (conMayuscula.get(t) ?? 0) + 1);
    }
    for (const t of normalizarTexto(f.texto).split(' ')) apariciones.set(t, (apariciones.get(t) ?? 0) + 1);
  }
  for (const [t, n] of conMayuscula) {
    if (n / (apariciones.get(t) ?? n) >= 0.7) fuentes.push(t);
  }
  const vocabulario = new Set(
    fuentes.flatMap(t => normalizarTexto(t).split(' '))
      .filter(t => t.length >= 4 && !PALABRAS_PLANTILLA.has(t)),
  );
  cacheVocabulario.set(paquete, vocabulario);
  return vocabulario;
}

/** true si a y b difieren en a lo sumo una letra (cambiada, sobrante o faltante). */
export function aUnaLetra(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  let j = 0;
  let diferencias = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++diferencias > 1) return false;
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else { i++; j++; }
  }
  return diferencias + (a.length - i) + (b.length - j) <= 1;
}

export function crearNormalizador(sinonimos: Sinonimo[], vocabulario: Set<string> = new Set()): NormalizadorConsulta {
  // equivalente normalizado → término canónico normalizado; los más largos primero ("valle lunar")
  const pares = sinonimos
    .flatMap(s => s.equivalentes.map(eq => [normalizarTexto(eq), normalizarTexto(s.termino)] as const))
    .filter(([eq]) => eq.length > 0)
    .sort((a, b) => b[0].length - a[0].length);
  const palabrasVocabulario = [...vocabulario].filter(v => v.length >= LARGO_MINIMO_CORRECCION - 1);

  return {
    normalizar(texto: string, estacionId: string | null, nivel: Nivel): Consulta {
      const base = normalizarTexto(texto);
      const extra = new Set<string>();

      // Ortografía: "frailejom" → agrega "frailejon".
      for (const palabra of base.split(' ')) {
        if (palabra.length < LARGO_MINIMO_CORRECCION || vocabulario.has(palabra)) continue;
        const correcta = palabrasVocabulario.find(v => aUnaLetra(palabra, v));
        if (correcta) extra.add(correcta);
      }

      const conEspacios = ` ${[base, ...extra].join(' ')} `;
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
