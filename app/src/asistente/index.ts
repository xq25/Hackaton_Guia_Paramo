/**
 * Punto de entrada del asistente. ÚNICO archivo de esta carpeta que importa Dev C.
 *
 * B0 (stub): la firma es la definitiva; el comportamiento es de mentira.
 * - responder(): normaliza → filtro de seguridad (B2) → búsqueda + evidencia + citas (B3).
 *   Sin modelo todavía: devuelve los fragmentos como RESPALDO_SIN_MODELO (el modelo llega en B4/B5).
 * - fichas: desbloquear compara en texto plano; lo demás no hace nada.
 * La firma de este archivo no cambia sin OK de C (docs/tareas/dev-b-asistente.md).
 */
import {
  MotivoLimite,
  TipoRespuesta,
  type Almacen,
  type ConfiguracionApp,
  type FichaContenido,
  type GestorFichas,
  type MotorModelo,
  type Nivel,
  type OrquestadorRespuestas,
  type PaqueteContenido,
  type Respuesta,
} from '../dominio/modelo';
import { advertencias, citarFragmento, crearGeneradorCitas } from './citas';
import { crearEvaluadorEvidencia } from './evaluadorEvidencia';
import { crearFiltroSeguridad } from './filtroSeguridad';
import { crearMotorBusqueda } from './motorBusqueda';
import { crearNormalizador } from './normalizador';
import { REGLAS } from './reglas';

export interface Asistente {
  orquestador: OrquestadorRespuestas;   // responder(texto, estacionId, nivel)
  fichas: GestorFichas;                 // al activar/retirar, reindexa solo
  versionGuion(): string;               // versión del paquete + fichas activas
  precargarModelo(): Promise<void>;     // C la llama al abrir el chat
  liberarModelo(): Promise<void>;       // C la llama al ir a segundo plano
}

export function crearAsistente(deps: {
  paquete: PaqueteContenido;
  config: ConfiguracionApp;
  almacen: Almacen;          // claves con prefijo 'fichas.'
  modelo?: MotorModelo;      // para tests; si falta, usa motorModelo.ts (llama.rn)
}): Asistente {
  const { paquete, config } = deps;

  const normalizador = crearNormalizador(paquete.sinonimos ?? []);
  const filtro = crearFiltroSeguridad(REGLAS, paquete);
  const motor = crearMotorBusqueda(paquete.estaciones ?? []);
  motor.indexar(paquete.fragmentos);
  const evaluador = crearEvaluadorEvidencia(paquete);
  const generadorCitas = crearGeneradorCitas(paquete);

  const abstencion = (inicio: number): Respuesta => ({
    tipo: TipoRespuesta.ABSTENCION,
    texto: 'Eso no está en el guion. Pregúntale a tu guía o al personal del parque.',
    citas: [],
    motivo: MotivoLimite.SIN_EVIDENCIA,
    ampliable: false,
    advertencias: [],
    tiempoMs: Date.now() - inicio,
  });

  const orquestador: OrquestadorRespuestas = {
    async responder(texto: string, estacionId: string | null, nivel: Nivel): Promise<Respuesta> {
      const inicio = Date.now();
      try {
        const consulta = normalizador.normalizar(texto, estacionId, nivel);
        const limite = filtro.evaluar(consulta);
        if (limite) return { ...limite, tiempoMs: Date.now() - inicio };

        const resultados = motor.buscar(consulta, config.maxFragmentos);
        const evidencia = evaluador.evaluar(resultados, config.umbralEvidencia);
        if (!evidencia.suficiente) return abstencion(inicio);

        const fragmentos = evidencia.resultados.map(r => r.fragmento);
        const base = {
          citas: generadorCitas.citar(evidencia),
          advertencias: advertencias(fragmentos),
          ampliable: false,
        };

        if (evidencia.diferencia) {
          const versiones = fragmentos.map(f => {
            const cita = citarFragmento(f, paquete);
            return `• ${cita.guionTitulo}, p. ${cita.pagina}: ${f.texto}`;
          });
          return {
            ...base,
            tipo: TipoRespuesta.CON_DIFERENCIA_ENTRE_FUENTES,
            texto: [`Los guiones no coinciden en esto. ${evidencia.diferencia.nota}`, ...versiones].join('\n\n'),
            tiempoMs: Date.now() - inicio,
          };
        }

        // Sin modelo todavía (B4/B5): los fragmentos tal cual.
        return {
          ...base,
          tipo: TipoRespuesta.RESPALDO_SIN_MODELO,
          texto: fragmentos.map(f => f.texto).join('\n\n'),
          tiempoMs: Date.now() - inicio,
        };
      } catch {
        return abstencion(inicio); // responder() nunca lanza
      }
    },
  };

  const fichas: GestorFichas = {
    desbloquear: (contrasena: string) => contrasena === config.pinAdministracion,
    validar: (_ficha: FichaContenido) => [],
    guardarBorrador: async () => {},
    activar: async () => {},
    retirar: async () => {},
    exportar: async () => '',
    importar: async () => [],
  };

  return {
    orquestador,
    fichas,
    versionGuion: () => paquete.version,
    precargarModelo: async () => {},
    liberarModelo: async () => {},
  };
}
