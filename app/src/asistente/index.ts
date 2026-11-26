/**
 * Punto de entrada del asistente. ÚNICO archivo de esta carpeta que importa Dev C.
 * La firma de este archivo no cambia sin OK de C (docs/tareas/dev-b-asistente.md).
 *
 * Estado:
 * - orquestador: flujo completo (B2 filtro, B3 búsqueda/evidencia/citas, B5 prompt + modelo).
 * - modelo: si `deps.modelo` falta, por ahora no hay modelo y responde con el guion tal cual
 *   (RESPALDO_SIN_MODELO). motorModelo.ts (llama.rn) llega en B4.
 * - fichas: stub hasta B6 (desbloquear compara en texto plano; lo demás no hace nada).
 */
import type {
  Almacen,
  ConfiguracionApp,
  FichaContenido,
  GestorFichas,
  MotorModelo,
  OrquestadorRespuestas,
  PaqueteContenido,
} from '../dominio/modelo';
import { crearMotorBusqueda } from './motorBusqueda';
import { conPlazo, crearOrquestador } from './orquestador';

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
  const modelo = deps.modelo ?? null; // B4: ?? crearMotorModelo()

  const motor = crearMotorBusqueda(paquete.estaciones ?? []);
  motor.indexar(paquete.fragmentos);

  // ── Ciclo de vida del modelo: una sola carga a la vez; nunca lanza hacia C ──
  let cargando: Promise<boolean> | null = null;

  function cargar(): Promise<boolean> {
    if (!modelo) return Promise.resolve(false);
    if (modelo.estaListo()) return Promise.resolve(true);
    cargando ??= modelo.cargar(config.rutaModelo).then(
      () => modelo.estaListo(),
      () => { cargando = null; return false; }, // se reintenta en la próxima pregunta
    );
    return cargando;
  }

  async function modeloListo(plazoMs: number): Promise<MotorModelo | null> {
    if (!modelo) return null;
    try {
      return (await conPlazo(cargar(), plazoMs)) ? modelo : null;
    } catch {
      return null; // no cargó a tiempo: esta respuesta va sin modelo, la carga sigue
    }
  }

  const orquestador = crearOrquestador({
    paquete: () => paquete,
    config,
    motor,
    modeloListo,
  });

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
    precargarModelo: async () => { await cargar(); },
    liberarModelo: async () => {
      cargando = null;
      try { await modelo?.liberar(); } catch { /* nunca lanza hacia C */ }
    },
  };
}
