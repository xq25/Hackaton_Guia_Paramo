/**
 * Arma el prompt: instrucciones fijas + fragmentos numerados + pregunta.
 * Al modelo NO se le pasan guion ni página ni se le piden citas: las pone el sistema (citas.ts).
 * Los relatos de tradición oral y los datos fechados van marcados para que no los presente
 * como hechos actuales.
 */
import {
  Naturaleza,
  Nivel,
  type Consulta,
  type ConstructorPrompt,
  type Evidencia,
  type Fragmento,
} from '../dominio/modelo';

const BASE =
  'Eres un guía del PNN Los Nevados. Responde en español sencillo, SOLO con la información '
  + 'de los fragmentos. Si no está, di que no lo sabes. No des indicaciones de seguridad ni de salud. '
  + 'No menciones páginas ni números de fragmento.';

export const SISTEMA_BREVE = `${BASE} Responde en máximo 3 frases.`;
export const SISTEMA_AMPLIADO = `${BASE} Responde en máximo 6 frases.`;

function marca(f: Fragmento): string {
  if (f.naturaleza === Naturaleza.TRADICION_ORAL) return ' [relato de tradición oral]';
  if (f.naturaleza === Naturaleza.DATO_FECHADO) {
    return f.fechaDato ? ` [dato de ${f.fechaDato.slice(0, 4)}]` : ' [dato con fecha, puede haber cambiado]';
  }
  return '';
}

export function crearConstructorPrompt(): ConstructorPrompt {
  return {
    construir(consulta: Consulta, evidencia: Evidencia) {
      const fragmentos = evidencia.resultados
        .map(({ fragmento: f }, i) => `[${i + 1}] ${f.titulo}${marca(f)}: ${f.texto}`)
        .join('\n');
      return {
        sistema: consulta.nivel === Nivel.AMPLIADO ? SISTEMA_AMPLIADO : SISTEMA_BREVE,
        usuario: `Fragmentos:\n${fragmentos}\n\nPregunta: ${consulta.textoOriginal.trim()}`,
      };
    },
  };
}
