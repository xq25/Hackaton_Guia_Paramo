/**
 * Flujo de una pregunta (docs/03-asistente.md):
 *   normalizar → filtro → buscar → evidencia → (diferencia | prompt + modelo) → citas → Respuesta
 *
 * Garantías:
 * - responder() NUNCA lanza: ante cualquier error, ABSTENCION o RESPALDO_SIN_MODELO.
 * - Las citas salen de los fragmentos (citas.ts), nunca del texto del modelo.
 * - Si el modelo no está, falla, tarda más de timeoutModeloMs o dice que no sabe:
 *   RESPALDO_SIN_MODELO con el texto del guion tal cual.
 * - Las diferencias entre fuentes no pasan por el modelo: se muestran ambas versiones.
 */
import {
  MotivoLimite,
  Nivel,
  TipoRespuesta,
  type ConfiguracionApp,
  type Evidencia,
  type Fragmento,
  type MotorBusqueda,
  type MotorModelo,
  type OrquestadorRespuestas,
  type PaqueteContenido,
  type Respuesta,
} from '../dominio/modelo';
import { advertencias, citarFragmento, crearGeneradorCitas } from './citas';
import { crearEvaluadorEvidencia } from './evaluadorEvidencia';
import { crearFiltroSeguridad } from './filtroSeguridad';
import { crearNormalizador } from './normalizador';
import { crearConstructorPrompt } from './prompt';
import { REGLAS } from './reglas';

export const TEXTO_ABSTENCION = 'Eso no está en el guion. Pregúntale a tu guía o al personal del parque.';

/** El modelo dice que no sabe → se muestra el guion tal cual. */
const NO_SABE = /\bno (lo )?s[eé]\b|\bno (tengo|hay) (esa )?informaci[oó]n\b|\bno (aparece|est[aá]) en (los )?fragmentos\b/i;

export interface DependenciasOrquestador {
  /** Se lee en cada pregunta: las fichas (B6) pueden cambiar el paquete activo. */
  paquete: () => PaqueteContenido;
  config: ConfiguracionApp;
  motor: MotorBusqueda;
  /** Devuelve el modelo listo, o null si no está (o no carga antes del plazo). */
  modeloListo: (plazoMs: number) => Promise<MotorModelo | null>;
}

/** Rechaza si la promesa no se resuelve en `ms`. */
export function conPlazo<T>(promesa: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolver, rechazar) => {
    const reloj = setTimeout(() => rechazar(new Error('plazo')), Math.max(0, ms));
    promesa.then(
      v => { clearTimeout(reloj); resolver(v); },
      e => { clearTimeout(reloj); rechazar(e); },
    );
  });
}

/** Quita marcas de fragmento o páginas que el modelo haya escrito por su cuenta. */
export function limpiarTextoModelo(texto: string): string {
  return texto
    .replace(/\[\d+\]/g, '')
    .replace(/\(?\b(p\.|p[aá]g\.?|p[aá]gina)\s*\d+\)?/gi, '')
    .replace(/[ \t]+([.,;:])/g, '$1')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

export function crearOrquestador(deps: DependenciasOrquestador): OrquestadorRespuestas {
  const { config, motor } = deps;
  const prompt = crearConstructorPrompt();

  const abstencion = (inicio: number): Respuesta => ({
    tipo: TipoRespuesta.ABSTENCION,
    texto: TEXTO_ABSTENCION,
    citas: [],
    motivo: MotivoLimite.SIN_EVIDENCIA,
    ampliable: false,
    advertencias: [],
    tiempoMs: Date.now() - inicio,
  });

  async function responder(texto: string, estacionId: string | null, nivel: Nivel): Promise<Respuesta> {
    const inicio = Date.now();
    const paquete = deps.paquete();

    const consulta = crearNormalizador(paquete.sinonimos ?? []).normalizar(texto, estacionId, nivel);
    const limite = crearFiltroSeguridad(REGLAS, paquete).evaluar(consulta);
    if (limite) return { ...limite, tiempoMs: Date.now() - inicio };

    const resultados = motor.buscar(consulta, config.maxFragmentos);
    const evidencia: Evidencia = crearEvaluadorEvidencia(paquete).evaluar(resultados, config.umbralEvidencia);
    if (!evidencia.suficiente || evidencia.resultados.length === 0) return abstencion(inicio);

    const fragmentos = evidencia.resultados.map(r => r.fragmento);
    const base = {
      citas: crearGeneradorCitas(paquete).citar(evidencia),
      advertencias: advertencias(fragmentos),
    };
    const fin = (r: Omit<Respuesta, 'citas' | 'advertencias' | 'tiempoMs'>): Respuesta =>
      ({ ...r, ...base, tiempoMs: Date.now() - inicio });

    if (evidencia.diferencia) {
      const versiones = fragmentos.map(f => {
        const cita = citarFragmento(f, paquete);
        return `• ${cita.guionTitulo}, p. ${cita.pagina}: ${f.texto}`;
      });
      return fin({
        tipo: TipoRespuesta.CON_DIFERENCIA_ENTRE_FUENTES,
        texto: [`Los guiones no coinciden en esto. ${evidencia.diferencia.nota}`, ...versiones].join('\n\n'),
        ampliable: false,
      });
    }

    const respaldo = (): Respuesta => fin({
      tipo: TipoRespuesta.RESPALDO_SIN_MODELO,
      texto: textoRespaldo(fragmentos),
      ampliable: false,
    });

    try {
      const plazo = config.timeoutModeloMs - (Date.now() - inicio);
      const modelo = await deps.modeloListo(plazo);
      if (!modelo) return respaldo();

      const restante = config.timeoutModeloMs - (Date.now() - inicio);
      const salida = await conPlazo(
        modelo.generar(prompt.construir(consulta, evidencia), config.maxTokens, restante),
        restante,
      );
      const redactado = limpiarTextoModelo(salida ?? '');
      if (!redactado || NO_SABE.test(redactado)) return respaldo();

      return fin({
        tipo: TipoRespuesta.RESPONDIDA,
        texto: redactado,
        ampliable: nivel === Nivel.BREVE,
      });
    } catch {
      return respaldo(); // falló o tardó: el guion tal cual
    }
  }

  return {
    async responder(texto, estacionId, nivel) {
      const inicio = Date.now();
      try {
        return await responder(texto ?? '', estacionId, nivel);
      } catch {
        return abstencion(inicio); // responder() nunca lanza
      }
    },
  };
}

function textoRespaldo(fragmentos: Fragmento[]): string {
  return `Esto dice el guion:\n\n${fragmentos.map(f => f.texto).join('\n\n')}`;
}
