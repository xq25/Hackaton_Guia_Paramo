/**
 * MotorModelo sobre llama.rn. ÚNICO archivo que usa llama.rn.
 *
 * - La librería se carga recién en cargar() (import diferido): importar el asistente no toca
 *   el módulo nativo, y los tests nunca lo cargan (inyectan su propio MotorModelo).
 * - Modelo: config.rutaModelo (Gemma 4 E2B GGUF Q4; respaldo Qwen3.5-0.8B), contexto 2048.
 * - Una generación a la vez (un contexto de llama no admite dos en paralelo).
 * - Timeout: se detiene la generación en el celular (stopCompletion) y se rechaza; el
 *   orquestador responde entonces con el guion tal cual (RESPALDO_SIN_MODELO).
 */
import type { LlamaContext } from 'llama.rn';
import type { MotorModelo } from '../dominio/modelo';

type LlamaRN = Pick<typeof import('llama.rn'), 'initLlama'>;

export const PARAMETROS_MODELO = {
  n_ctx: 2048,
  n_threads: 4,
  n_gpu_layers: 0,     // CPU: lo más compatible entre celulares; probar >0 en el de la demo
  use_mlock: false,
  temperatura: 0.2,
  top_p: 0.9,
  /** Fin de turno de Gemma y de Qwen, por si la plantilla no lo corta. */
  stop: ['<end_of_turn>', '<|im_end|>', '<|endoftext|>'],
} as const;

export function crearMotorModelo(
  cargarLlama: () => Promise<LlamaRN> = () => import('llama.rn'),
): MotorModelo {
  let contexto: LlamaContext | null = null;
  let cola: Promise<unknown> = Promise.resolve();

  async function generarAhora(
    ctx: LlamaContext,
    prompt: { sistema: string; usuario: string },
    maxTokens: number,
    timeoutMs: number,
  ): Promise<string> {
    let reloj: ReturnType<typeof setTimeout> | undefined;
    const plazo = new Promise<never>((_, rechazar) => {
      reloj = setTimeout(() => {
        ctx.stopCompletion().catch(() => {}); // libera la CPU del celular
        rechazar(new Error('El modelo tardó demasiado.'));
      }, Math.max(0, timeoutMs));
    });
    try {
      const resultado = await Promise.race([
        ctx.completion({
          messages: [
            { role: 'system', content: prompt.sistema },
            { role: 'user', content: prompt.usuario },
          ],
          jinja: true,
          enable_thinking: false,
          n_predict: maxTokens,
          temperature: PARAMETROS_MODELO.temperatura,
          top_p: PARAMETROS_MODELO.top_p,
          stop: [...PARAMETROS_MODELO.stop],
        }),
        plazo,
      ]);
      return (resultado.content || resultado.text || '').trim();
    } finally {
      clearTimeout(reloj);
    }
  }

  return {
    async cargar(rutaModelo: string): Promise<void> {
      if (contexto) return;
      const { initLlama } = await cargarLlama();
      contexto = await initLlama({
        model: rutaModelo.replace(/^file:\/\//, ''),
        n_ctx: PARAMETROS_MODELO.n_ctx,
        n_threads: PARAMETROS_MODELO.n_threads,
        n_gpu_layers: PARAMETROS_MODELO.n_gpu_layers,
        use_mlock: PARAMETROS_MODELO.use_mlock,
      });
    },

    generar(prompt, maxTokens, timeoutMs): Promise<string> {
      const ctx = contexto;
      if (!ctx) return Promise.reject(new Error('El modelo no está cargado.'));
      // En cola: si llega otra pregunta mientras genera, espera su turno.
      const turno = cola.then(() => generarAhora(ctx, prompt, maxTokens, timeoutMs));
      cola = turno.catch(() => {});
      return turno;
    },

    estaListo: () => contexto !== null,

    async liberar(): Promise<void> {
      const ctx = contexto;
      contexto = null;
      if (ctx) await ctx.release();
    },
  };
}
