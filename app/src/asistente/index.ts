/**
 * Punto de entrada del asistente. ÚNICO archivo de esta carpeta que importa Dev C.
 *
 * B0 (stub): la firma es la definitiva; el comportamiento es de mentira.
 * - responder(): primer fragmento apto de la estación como RESPALDO_SIN_MODELO, con su cita.
 * - fichas: desbloquear compara en texto plano; lo demás no hace nada.
 * La firma de este archivo no cambia sin OK de C (docs/tareas/dev-b-asistente.md).
 */
import {
  MotivoLimite,
  TipoRespuesta,
  type Almacen,
  type Cita,
  type ConfiguracionApp,
  type FichaContenido,
  type Fragmento,
  type GestorFichas,
  type MotorModelo,
  type Nivel,
  type OrquestadorRespuestas,
  type PaqueteContenido,
  type Respuesta,
} from '../dominio/modelo';

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

  const citar = (f: Fragmento): Cita => ({
    guionTitulo: paquete.guiones.find(g => g.id === f.guionId)?.titulo ?? f.guionId,
    pagina: f.pagina,
    estacionNombre: f.estacionId
      ? paquete.estaciones.find(e => e.id === f.estacionId)?.nombre ?? null
      : null,
    naturaleza: f.naturaleza,
  });

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
    async responder(_texto: string, estacionId: string | null, _nivel: Nivel): Promise<Respuesta> {
      const inicio = Date.now();
      try {
        const fragmento = paquete.fragmentos.find(f => f.apto && f.estacionId === estacionId);
        if (!fragmento) return abstencion(inicio);
        return {
          tipo: TipoRespuesta.RESPALDO_SIN_MODELO,
          texto: fragmento.texto,
          citas: [citar(fragmento)],
          ampliable: false,
          advertencias: [],
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
