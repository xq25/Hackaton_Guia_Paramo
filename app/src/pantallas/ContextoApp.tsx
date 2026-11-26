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
import { cargarCatalogo, cargarPaquete } from '../datos/repositorio';
import {
  MetodoRegistro,
  type Almacen,
  type ConfiguracionApp,
  type EspecieCatalogo,
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
  versionGuion: string;
  refrescarVersionGuion: () => void;
  progreso: ProgresoJuego;
  estadoProgreso: ProgresoLocal;
  modoDemoActivo: boolean;
  verificarPinDemo: (pin: string) => boolean;
  cambiarModoDemo: (activo: boolean) => void;
  registrarLlegadaDemo: (estacionId: string) => Promise<ResultadoVisita>;
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

  const asistente = useMemo(
    () => asistenteProp ?? crearAsistente({ paquete, config, almacen }),
    [asistenteProp, paquete, config, almacen]
  );

  const progreso = useMemo(
    () => progresoProp ?? crearGestorProgreso({ paquete, almacen }),
    [progresoProp, paquete, almacen]
  );

  const [revisionGuion, setRevisionGuion] = useState(0);
  const [estadoProgreso, setEstadoProgreso] = useState<ProgresoLocal>(PROGRESO_VACIO);
  const [modoDemoActivo, setModoDemoActivo] = useState<boolean>(
    () => almacen.leer(CLAVE_MODO_DEMO) === '1'
  );

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
    // revisionGuion fuerza a releer asistente.versionGuion() tras publicar o retirar fichas en el editor
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [asistente, revisionGuion]
  );

  const cambiarModoDemo = useCallback(
    (activo: boolean) => {
      if (activo) {
        almacen.escribir(CLAVE_MODO_DEMO, '1');
      } else {
        almacen.borrar(CLAVE_MODO_DEMO);
      }
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
      versionGuion,
      refrescarVersionGuion,
      progreso,
      estadoProgreso,
      modoDemoActivo,
      verificarPinDemo,
      cambiarModoDemo,
      registrarLlegadaDemo,
      reiniciarProgreso,
    }),
    [
      paquete,
      catalogo,
      config,
      almacen,
      asistente,
      versionGuion,
      refrescarVersionGuion,
      progreso,
      estadoProgreso,
      modoDemoActivo,
      verificarPinDemo,
      cambiarModoDemo,
      registrarLlegadaDemo,
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
