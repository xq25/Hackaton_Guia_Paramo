import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type { Estacion } from '../dominio/modelo';
import { colores, espacio, tamanos, tipografia } from '../pantallas/tema';
import { bytesABase64 } from './base64';
import { cargarRuta, crearLectorRangos, ubicarPmtiles } from './fuenteMapa';
import { MAPA_HTML } from './mapaHtml.generado';
import { estacionesDeRuta, puntosSenderoMapa, referenciasDeRuta } from './ruta';

export interface VistaMapaProps {
  estaciones: Estacion[];
  estacionesVisitadasIds: string[];
  /** Estación donde se ubica actualmente el caminante simulado. */
  estacionSimuladaId?: string | null;
  alSeleccionarEstacion: (estacionId: string) => void;
}

export function VistaMapa({
  estaciones,
  estacionesVisitadasIds,
  estacionSimuladaId = null,
  alSeleccionarEstacion,
}: VistaMapaProps) {
  const webRef = useRef<WebView<object> | null>(null);
  const lectorRef = useRef<ReturnType<typeof crearLectorRangos> | null>(null);
  const inicializadoRef = useRef(false);

  const [webListo, setWebListo] = useState(false);
  const [recursosListos, setRecursosListos] = useState(false);
  const [tieneTeselas, setTieneTeselas] = useState(false);
  const [rutaGeo, setRutaGeo] = useState<unknown | null>(null);

  const enviar = useCallback((mensaje: Record<string, unknown>) => {
    const js = `window.recibir && window.recibir(${JSON.stringify(mensaje)}); true;`;
    webRef.current?.injectJavaScript(js);
  }, []);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      const [archivoPmtiles, geo] = await Promise.all([ubicarPmtiles(), cargarRuta()]);
      if (cancelado) return;
      if (archivoPmtiles) {
        lectorRef.current = crearLectorRangos(archivoPmtiles);
        setTieneTeselas(true);
      }
      setRutaGeo(geo);
      setRecursosListos(true);
    })();
    return () => {
      cancelado = true;
      lectorRef.current?.cerrar();
      lectorRef.current = null;
    };
  }, []);

  const puntos = useMemo(
    () => puntosSenderoMapa(estaciones, estacionesDeRuta(rutaGeo)),
    [estaciones, rutaGeo]
  );

  const referencias = useMemo(() => referenciasDeRuta(rutaGeo), [rutaGeo]);

  // Inicializa una sola vez cuando el WebView y los archivos locales están listos.
  useEffect(() => {
    if (!webListo || !recursosListos || inicializadoRef.current) return;
    inicializadoRef.current = true;
    enviar({
      tipo: 'iniciar',
      tieneTeselas,
      ruta: rutaGeo,
      estaciones: puntos,
      referencias,
      visitadas: estacionesVisitadasIds,
      simuladaId: estacionSimuladaId,
    });
  }, [
    webListo,
    recursosListos,
    tieneTeselas,
    rutaGeo,
    puntos,
    referencias,
    estacionesVisitadasIds,
    estacionSimuladaId,
    enviar,
  ]);

  // Actualiza los colores de estaciones visitadas sin reiniciar el zoom del usuario.
  useEffect(() => {
    if (!inicializadoRef.current) return;
    enviar({ tipo: 'visitas', visitadas: estacionesVisitadasIds });
  }, [estacionesVisitadasIds, enviar]);

  // Mueve el marcador 🚶 cuando cambia la estación en el simulador de caminata.
  useEffect(() => {
    if (!inicializadoRef.current || !estacionSimuladaId) return;
    enviar({ tipo: 'caminante', estacionId: estacionSimuladaId, centrar: true });
  }, [estacionSimuladaId, enviar]);

  const alRecibirMensaje = useCallback(
    (ev: WebViewMessageEvent) => {
      try {
        const msg = JSON.parse(ev.nativeEvent.data) as {
          tipo?: string;
          id?: string | number;
          offset?: number;
          length?: number;
        };
        if (msg.tipo === 'listo') {
          setWebListo(true);
        } else if (msg.tipo === 'estacion' && typeof msg.id === 'string') {
          alSeleccionarEstacion(msg.id);
        } else if (
          msg.tipo === 'rango' &&
          typeof msg.id === 'number' &&
          typeof msg.offset === 'number' &&
          typeof msg.length === 'number'
        ) {
          const lector = lectorRef.current;
          if (!lector) {
            enviar({ tipo: 'rangoError', id: msg.id, mensaje: 'Sin archivo pmtiles' });
            return;
          }
          const reqId = msg.id;
          lector
            .leer(msg.offset, msg.length)
            .then((bytes) => enviar({ tipo: 'rangoOk', id: reqId, base64: bytesABase64(bytes) }))
            .catch((err) => enviar({ tipo: 'rangoError', id: reqId, mensaje: String(err) }));
        }
      } catch {
        // Mensaje no JSON ignorado
      }
    },
    [alSeleccionarEstacion, enviar]
  );

  return (
    <View style={estilos.contenedor}>
      <WebView<object>
        ref={webRef}
        originWhitelist={['*']}
        source={{ html: MAPA_HTML }}
        onMessage={alRecibirMensaje}
        javaScriptEnabled
        domStorageEnabled={false}
        style={estilos.webview}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Centrar mapa en el sendero"
        onPress={() => enviar({ tipo: 'encuadrarRuta' })}
        style={estilos.botonCentrar}
      >
        <Text style={estilos.textoCentrar}>🎯 Sendero</Text>
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.superficie },
  webview: { flex: 1, backgroundColor: 'transparent' },
  botonCentrar: {
    position: 'absolute',
    right: espacio.s + 2,
    top: 170,
    backgroundColor: colores.fondo,
    borderWidth: tamanos.bordeGrueso,
    borderColor: colores.borde,
    borderRadius: tamanos.radio,
    paddingHorizontal: espacio.s + 2,
    paddingVertical: 6,
    elevation: 3,
  },
  textoCentrar: {
    fontSize: 12,
    fontWeight: tipografia.pesoFuerte,
    color: colores.texto,
  },
});
