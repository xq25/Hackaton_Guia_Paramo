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
import {
  motorSinArchivoLocal,
  resolverRutaModeloActiva,
  type EstadoArchivoModelo,
} from '../datos/modeloLocal';
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
  /** Única instancia activa de Asistente (Dev B) y ProgresoJuego (Dev A). */
  asistente: Asistente;
  estadoModelo: EstadoArchivoModelo;
  modeloLocalDisponible: boolean;
  refrescarEstadoModelo: () => Promise<void>;
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

  const [revisionModelo, setRevisionModelo] = useState(0);

  const estadoModelo = useMemo(
    () => resolverRutaModeloActiva(config.rutaModelo),
    // revisionModelo permite recargar en caliente tras descargar o importar un .gguf en Ajustes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config.rutaModelo, revisionModelo]
  );

  const asistente = useMemo(() => {
    if (asistenteProp) return asistenteProp;
    const configEfectiva: ConfiguracionApp = {
      ...config,
      rutaModelo: estadoModelo.rutaEfectiva,
    };
    return crearAsistente({
      paquete,
      config: configEfectiva,
      almacen,
      modelo: estadoModelo.disponible ? undefined : motorSinArchivoLocal,
    });
  }, [asistenteProp, paquete, config, almacen, estadoModelo]);

  const refrescarEstadoModelo = useCallback(async () => {
    await asistente.liberarModelo();
    setRevisionModelo((n) => n + 1);
  }, [asistente]);

  const progreso = useMemo(
    () => progresoProp ?? crearGestorProgreso({ paquete, almacen }),
    [progresoProp, paquete, almacen]
  );

  const [revisionGuion, setRevisionGuion] = useState(0);
  const [estadoProgreso, setEstadoProgreso] = useState<ProgresoLocal>(PROGRESO_VACIO);

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
      estadoModelo,
      modeloLocalDisponible: estadoModelo.disponible,
      refrescarEstadoModelo,
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
      estadoModelo,
      refrescarEstadoModelo,
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
