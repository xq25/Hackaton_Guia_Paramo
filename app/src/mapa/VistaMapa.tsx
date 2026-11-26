import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type { Estacion } from '../dominio/modelo';
import { colores, espacio, tamanos, tipografia } from '../pantallas/tema';
import { bytesABase64 } from './base64';
import { cargarRuta, crearLectorRangos, ubicarPmtiles } from './fuenteMapa';
import { MAPA_HTML } from './mapaHtml.generado';
import { estacionesDeRuta } from './ruta';

export interface VistaMapaProps {
  estaciones: Estacion[];
  estacionesVisitadasIds: string[];
  alSeleccionarEstacion: (estacionId: string) => void;
}

interface PuntoMapa {
  id: string;
  nombre: string;
  lat: number | null;
  lon: number | null;
  aproximada: boolean;
}

export function VistaMapa({
  estaciones,
  estacionesVisitadasIds,
  alSeleccionarEstacion,
}: VistaMapaProps) {
  const webRef = useRef<WebView<object> | null>(null);
  const lectorRef = useRef<ReturnType<typeof crearLectorRangos> | null>(null);

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

  const puntos: PuntoMapa[] = useMemo(() => {
    const desdeRuta = estacionesDeRuta(rutaGeo);
    return [...estaciones]
      .sort((a, b) => a.orden - b.orden)
      .map((e) => {
        if (e.ubicacion) {
          return { id: e.id, nombre: e.nombre, lat: e.ubicacion.lat, lon: e.ubicacion.lon, aproximada: false };
        }
        const aprox = desdeRuta[e.id];
        if (aprox) {
          return { id: e.id, nombre: e.nombre, lat: aprox.lat, lon: aprox.lon, aproximada: aprox.aproximada };
        }
        return { id: e.id, nombre: e.nombre, lat: null, lon: null, aproximada: true };
      });
  }, [estaciones, rutaGeo]);

  const hayPinesEnMapa = useMemo(
    () => puntos.some((p) => p.lat != null && p.lon != null),
    [puntos]
  );

  // Inicializa el mapa cuando tanto el WebView como los archivos locales están listos.
  useEffect(() => {
    if (!webListo || !recursosListos) return;
    enviar({
      tipo: 'iniciar',
      tieneTeselas,
      ruta: rutaGeo,
      estaciones: puntos,
      visitadas: estacionesVisitadasIds,
    });
  }, [webListo, recursosListos, tieneTeselas, rutaGeo, puntos, estacionesVisitadasIds, enviar]);

  // Refresca colores de pines cuando cambian las visitas.
  useEffect(() => {
    if (!webListo || !recursosListos) return;
    enviar({ tipo: 'visitas', visitadas: estacionesVisitadasIds });
  }, [webListo, recursosListos, estacionesVisitadasIds, enviar]);

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

  const visitadasSet = useMemo(() => new Set(estacionesVisitadasIds), [estacionesVisitadasIds]);

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
      {recursosListos && !hayPinesEnMapa ? (
        <View style={estilos.respaldoEstaciones} accessibilityLabel="Estaciones del recorrido">
          <Text style={estilos.respaldoAviso}>
            Estaciones del recorrido (posiciones pendientes de ruta.geojson):
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.respaldoFila}>
            {[...estaciones]
              .sort((a, b) => a.orden - b.orden)
              .map((e) => {
                const visitada = visitadasSet.has(e.id);
                return (
                  <Pressable
                    key={e.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Estación ${e.nombre}`}
                    onPress={() => alSeleccionarEstacion(e.id)}
                    style={[
                      estilos.fichaEstacion,
                      { borderColor: visitada ? colores.visitada : colores.borde },
                    ]}
                  >
                    <View
                      style={[
                        estilos.puntoEstado,
                        { backgroundColor: visitada ? colores.visitada : colores.sinVisitar },
                      ]}
                    />
                    <Text style={estilos.fichaTexto}>{e.nombre}</Text>
                  </Pressable>
                );
              })}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.superficie },
  webview: { flex: 1, backgroundColor: 'transparent' },
  respaldoEstaciones: {
    position: 'absolute',
    left: espacio.m,
    right: espacio.m,
    top: 88,
    backgroundColor: colores.fondo,
    borderRadius: tamanos.radio,
    borderWidth: tamanos.bordeGrueso,
    borderColor: colores.borde,
    padding: espacio.s,
    gap: espacio.xs,
  },
  respaldoAviso: {
    fontSize: tipografia.pequeno,
    color: colores.textoSuave,
    fontWeight: tipografia.pesoFuerte,
  },
  respaldoFila: { gap: espacio.s, paddingVertical: espacio.xs },
  fichaEstacion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.xs + 2,
    minHeight: tamanos.toqueMinimo,
    paddingHorizontal: espacio.m,
    backgroundColor: colores.superficie,
    borderRadius: tamanos.radio,
    borderWidth: tamanos.bordeGrueso,
  },
  puntoEstado: { width: 12, height: 12, borderRadius: 6 },
  fichaTexto: { fontSize: tipografia.cuerpo, fontWeight: tipografia.pesoFuerte, color: colores.texto },
});
