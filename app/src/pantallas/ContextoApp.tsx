import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { crearAsistente, type Asistente } from '../asistente';
import { CONFIG } from '../config';
import { claveCorrecta } from '../datos/claves';
import { existeArchivoModelo, motorSinArchivoLocal } from '../datos/modeloLocal';
import { cargarCatalogo, cargarPaquete } from '../datos/repositorio';
import {
  MetodoRegistro,
  type Almacen,
  type Coleccionable,
  type ConfiguracionApp,
  type EspecieCatalogo,
  type Insignia,
  type PaqueteContenido,
  type ProgresoLocal,
} from '../dominio/modelo';
import {
  crearGestorProgreso,
  type ProgresoJuego,
  type ResultadoVisita,
} from '../juego';

const CLAVE_MODO_DEMO = 'config.modoDemo';
const PROGRESO_VACIO: ProgresoLocal = {
  visitas: [],
  coleccionablesIds: [],
  insigniasIds: [],
  retosCorrectosIds: [],
};

export interface EstadoApp {
  paquete: PaqueteContenido;
  catalogo: EspecieCatalogo[];
  config: ConfiguracionApp;
  almacen: Almacen;
  /** Única instancia de Asistente (Dev B) y ProgresoJuego (Dev A) para toda la app. */
  asistente: Asistente;
  modeloLocalDisponible: boolean;
  versionGuion: string;
  refrescarVersionGuion: () => void;
  progreso: ProgresoJuego;
  estadoProgreso: ProgresoLocal;
  modoDemoActivo: boolean;
  verificarPinDemo: (pin: string) => boolean;
  cambiarModoDemo: (activo: boolean) => void;
  registrarLlegadaDemo: (estacionId: string) => Promise<ResultadoVisita>;
  desbloquearTodoDemo: () => Promise<ResultadoVisita>;
  reiniciarProgreso: () => Promise<void>;
}

const ContextoApp = createContext<EstadoApp | null>(null);

export interface ProveedorAppProps {
  almacen: Almacen;
  paquete?: PaqueteContenido;
  catalogo?: EspecieCatalogo[];
  config?: ConfiguracionApp;
  asistente?: Asistente;
  progreso?: ProgresoJuego;
  children: ReactNode;
}

/**
 * Crea e inyecta una sola vez Asistente (B) y ProgresoJuego (A) en toda la aplicación.
 */
export function ProveedorApp({
  almacen,
  paquete: paqueteProp,
  catalogo: catalogoProp,
  config = CONFIG,
  asistente: asistenteProp,
  progreso: progresoProp,
  children,
}: ProveedorAppProps) {
  const paquete = useMemo(() => paqueteProp ?? cargarPaquete(), [paqueteProp]);
  const catalogo = useMemo(() => catalogoProp ?? cargarCatalogo(), [catalogoProp]);

  const modeloLocalDisponible = useMemo(
    () => existeArchivoModelo(config.rutaModelo),
    [config.rutaModelo]
  );

  const asistente = useMemo(
    () =>
      asistenteProp ??
      crearAsistente({
        paquete,
        config,
        almacen,
        // Si modelo.gguf aún no está copiado en el celular, responde al instante con el guion oficial.
        modelo: modeloLocalDisponible ? undefined : motorSinArchivoLocal,
      }),
    [asistenteProp, paquete, config, almacen, modeloLocalDisponible]
  );

  const progreso = useMemo(
    () => progresoProp ?? crearGestorProgreso({ paquete, almacen }),
    [progresoProp, paquete, almacen]
  );

  const [revisionGuion, setRevisionGuion] = useState(0);
  const [estadoProgreso, setEstadoProgreso] = useState<ProgresoLocal>(PROGRESO_VACIO);

  // Con geocerca desactivada (modo pruebas fuera del parque, D13/D20), el simulador arranca activo
  // salvo que el usuario lo desactive explícitamente en Ajustes.
  const [modoDemoActivo, setModoDemoActivo] = useState<boolean>(() => {
    const guardado = almacen.leer(CLAVE_MODO_DEMO);
    if (guardado === '0') return false;
    if (guardado === '1') return true;
    return !config.geocercaActiva;
  });

  useEffect(() => {
    let activo = true;
    progreso.cargar().then((p) => {
      if (activo) setEstadoProgreso(p);
    });
    return () => {
      activo = false;
    };
  }, [progreso]);

  const refrescarVersionGuion = useCallback(() => {
    setRevisionGuion((n) => n + 1);
  }, []);

  const versionGuion = useMemo(
    () => asistente.versionGuion(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [asistente, revisionGuion]
  );

  const cambiarModoDemo = useCallback(
    (activo: boolean) => {
      almacen.escribir(CLAVE_MODO_DEMO, activo ? '1' : '0');
      setModoDemoActivo(activo);
    },
    [almacen]
  );

  const verificarPinDemo = useCallback(
    (pin: string) => claveCorrecta(pin, config.pinModoDemo),
    [config.pinModoDemo]
  );

  const registrarLlegadaDemo = useCallback(
    async (estacionId: string): Promise<ResultadoVisita> => {
      const resultado = await progreso.registrarVisita(estacionId, MetodoRegistro.DEMO);
      const actualizado = await progreso.cargar();
      setEstadoProgreso(actualizado);
      return resultado;
    },
    [progreso]
  );

  const desbloquearTodoDemo = useCallback(async (): Promise<ResultadoVisita> => {
    const ordenadas = [...paquete.estaciones].sort((a, b) => a.orden - b.orden);
    const coleccionables: Coleccionable[] = [];
    const insignias: Insignia[] = [];
    let huboNueva = false;

    for (const est of ordenadas) {
      const r = await progreso.registrarVisita(est.id, MetodoRegistro.DEMO);
      if (r.nueva) huboNueva = true;
      coleccionables.push(...r.coleccionables);
      insignias.push(...r.insignias);
    }
    const actualizado = await progreso.cargar();
    setEstadoProgreso(actualizado);
    return { nueva: huboNueva, coleccionables, insignias };
  }, [paquete.estaciones, progreso]);

  const reiniciarProgreso = useCallback(async () => {
    await progreso.reiniciar();
    const vacio = await progreso.cargar();
    setEstadoProgreso(vacio);
  }, [progreso]);

  const valor = useMemo<EstadoApp>(
    () => ({
      paquete,
      catalogo,
      config,
      almacen,
      asistente,
      modeloLocalDisponible,
      versionGuion,
      refrescarVersionGuion,
      progreso,
      estadoProgreso,
      modoDemoActivo,
      verificarPinDemo,
      cambiarModoDemo,
      registrarLlegadaDemo,
      desbloquearTodoDemo,
      reiniciarProgreso,
    }),
    [
      paquete,
      catalogo,
      config,
      almacen,
      asistente,
      modeloLocalDisponible,
      versionGuion,
      refrescarVersionGuion,
      progreso,
      estadoProgreso,
      modoDemoActivo,
      verificarPinDemo,
      cambiarModoDemo,
      registrarLlegadaDemo,
      desbloquearTodoDemo,
      reiniciarProgreso,
    ]
  );

  return <ContextoApp.Provider value={valor}>{children}</ContextoApp.Provider>;
}

export function usarApp(): EstadoApp {
  const ctx = useContext(ContextoApp);
  if (!ctx) throw new Error('usarApp debe llamarse dentro de ProveedorApp');
  return ctx;
}
