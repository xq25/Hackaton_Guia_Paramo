import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ResultadoVisita } from '../juego';
import { VistaMapa } from '../mapa';
import { HojaChat } from './chat';
import { Boton } from './comunes';
import { usarApp } from './ContextoApp';
import { PantallaEditor } from './editor';
import { PanelEstacion } from './estacion';
import { PantallaAlbum, PantallaInsignias, Recompensa } from './juego';
import { HojaAjustes, HojaCreditos, HojaMenuPerfil, HojaSeguridad } from './perfil';
import { colores, espacio, tamanos, tipografia } from './tema';

type HojaActiva =
  | 'ninguna'
  | 'chat'
  | 'menu'
  | 'seguridad'
  | 'creditos'
  | 'ajustes'
  | 'insignias'
  | 'album'
  | 'editor';

export function PantallaPrincipal() {
  const {
    paquete,
    catalogo,
    config,
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
  } = usarApp();

  const [estacionPanelId, setEstacionPanelId] = useState<string | null>(null);
  const [estacionChatId, setEstacionChatId] = useState<string | null>(null);
  const [hojaActiva, setHojaActiva] = useState<HojaActiva>('ninguna');
  const [recompensaActiva, setRecompensaActiva] = useState<ResultadoVisita | null>(null);

  const estacionSeleccionada = useMemo(
    () => paquete.estaciones.find((e) => e.id === estacionPanelId) ?? null,
    [paquete.estaciones, estacionPanelId]
  );

  const estacionesVisitadasIds = useMemo(
    () =>
      paquete.estaciones
        .filter((e) => progreso.estacionVisitada(estadoProgreso, e.id))
        .map((e) => e.id),
    [paquete.estaciones, progreso, estadoProgreso]
  );

  const abrirChatEnEstacion = (estacionId: string | null) => {
    setEstacionPanelId(null);
    setEstacionChatId(estacionId);
    setHojaActiva('chat');
  };

  const manejarLlegadaDemo = async (estacionId: string) => {
    const resultado = await registrarLlegadaDemo(estacionId);
    setEstacionPanelId(null);
    setRecompensaActiva(resultado);
  };

  const cerrarEditor = () => {
    refrescarVersionGuion();
    setHojaActiva('ninguna');
  };

  return (
    <View style={estilos.raiz}>
      {/* Mapa principal a pantalla completa (D14) */}
      <VistaMapa
        estaciones={paquete.estaciones}
        estacionesVisitadasIds={estacionesVisitadasIds}
        alSeleccionarEstacion={(id) => {
          setHojaActiva('ninguna');
          setEstacionPanelId(id);
        }}
      />

      {/* Barra superior: título + versión/fragmentos (C1b) + Seguridad siempre visible + Menú 👤 */}
      <View style={estilos.barraSuperior} pointerEvents="box-none">
        <View style={estilos.marca}>
          <Text style={estilos.titulo}>ParamON</Text>
          <Text style={estilos.subtituloFragmentos}>
            v{versionGuion} · {paquete.fragmentos.length} fragmentos
          </Text>
        </View>

        <View style={estilos.accionesSuperiores}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Seguridad y emergencias"
            onPress={() => {
              setEstacionPanelId(null);
              setHojaActiva('seguridad');
            }}
            style={estilos.botonSeguridadRapido}
          >
            <Text style={estilos.textoSeguridadRapido}>🆘 Seguridad</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir menú de perfil"
            onPress={() => {
              setEstacionPanelId(null);
              setHojaActiva('menu');
            }}
            style={estilos.botonPerfil}
          >
            <Text style={estilos.iconoPerfil}>👤</Text>
          </Pressable>
        </View>
      </View>

      {/* Barra inferior flotante: acceso rápido al Guía virtual */}
      <View style={estilos.barraInferior} pointerEvents="box-none">
        <View style={estilos.espaciador} />
        <Boton
          titulo="Guía"
          icono="💬"
          alPresionar={() => abrirChatEnEstacion(null)}
          estilo={estilos.botonFlotante}
        />
      </View>

      {/* Panel de estación conectado a ProgresoJuego (C4 + C6) */}
      <PanelEstacion
        estacion={estacionSeleccionada}
        alCerrar={() => setEstacionPanelId(null)}
        fragmentos={paquete.fragmentos}
        guiones={paquete.guiones}
        catalogo={catalogo}
        estacionVisitada={
          estacionSeleccionada
            ? progreso.estacionVisitada(estadoProgreso, estacionSeleccionada.id)
            : false
        }
        especieDesbloqueada={(cientifico) =>
          cientifico
            ? progreso.especieDesbloqueada(estadoProgreso, cientifico)
            : estacionSeleccionada
            ? progreso.estacionVisitada(estadoProgreso, estacionSeleccionada.id)
            : false
        }
        modoDemoActivo={modoDemoActivo}
        alRegistrarLlegadaDemo={manejarLlegadaDemo}
        alPreguntarAlGuia={(id) => abrirChatEnEstacion(id)}
      />

      {/* Chat del guía conectado a crearAsistente (C3 + S1/S7) */}
      <HojaChat
        visible={hojaActiva === 'chat'}
        alCerrar={() => setHojaActiva('ninguna')}
        estaciones={paquete.estaciones}
        estacionInicialId={estacionChatId}
        orquestador={asistente.orquestador}
        precargarModelo={asistente.precargarModelo}
        liberarModelo={asistente.liberarModelo}
        alAbrirSeguridad={() => setHojaActiva('seguridad')}
        alAbrirAlbum={() => setHojaActiva('album')}
      />

      {/* Menú de perfil con Insignias, Álbum, Editar guion, Seguridad, Créditos y Ajustes (C5) */}
      <HojaMenuPerfil
        visible={hojaActiva === 'menu'}
        alCerrar={() => setHojaActiva('ninguna')}
        alAbrirInsignias={() => setHojaActiva('insignias')}
        alAbrirAlbum={() => setHojaActiva('album')}
        alAbrirEditor={() => setHojaActiva('editor')}
        alAbrirSeguridad={() => setHojaActiva('seguridad')}
        alAbrirCreditos={() => setHojaActiva('creditos')}
        alAbrirAjustes={() => setHojaActiva('ajustes')}
      />

      <HojaSeguridad
        visible={hojaActiva === 'seguridad'}
        alCerrar={() => setHojaActiva('ninguna')}
      />

      <HojaCreditos
        visible={hojaActiva === 'creditos'}
        alCerrar={() => setHojaActiva('ninguna')}
      />

      <HojaAjustes
        visible={hojaActiva === 'ajustes'}
        alCerrar={() => setHojaActiva('ninguna')}
        versionGuion={versionGuion}
        geocercaActiva={config.geocercaActiva}
        modoDemoActivo={modoDemoActivo}
        verificarPinDemo={verificarPinDemo}
        alCambiarModoDemo={cambiarModoDemo}
        alReiniciarProgreso={reiniciarProgreso}
      />

      {/* Pantallas de juego de Dev A (S9) */}
      <Modal
        visible={hojaActiva === 'insignias'}
        animationType="slide"
        onRequestClose={() => setHojaActiva('ninguna')}
      >
        <View style={estilos.contenedorModal}>
          <PantallaInsignias
            progreso={progreso}
            alCerrar={() => setHojaActiva('ninguna')}
          />
        </View>
      </Modal>

      <Modal
        visible={hojaActiva === 'album'}
        animationType="slide"
        onRequestClose={() => setHojaActiva('ninguna')}
      >
        <View style={estilos.contenedorModal}>
          <PantallaAlbum
            progreso={progreso}
            catalogo={catalogo}
            alCerrar={() => setHojaActiva('ninguna')}
          />
        </View>
      </Modal>

      {/* Pantalla del editor de fichas de Dev B (S1/B7) */}
      <Modal
        visible={hojaActiva === 'editor'}
        animationType="slide"
        onRequestClose={cerrarEditor}
      >
        <View style={estilos.contenedorModal}>
          <PantallaEditor
            asistente={asistente}
            alCerrar={cerrarEditor}
          />
        </View>
      </Modal>

      {recompensaActiva ? (
        <Recompensa
          resultado={recompensaActiva}
          alCerrar={() => setRecompensaActiva(null)}
        />
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: colores.fondo },
  barraSuperior: {
    position: 'absolute',
    top: 40,
    left: espacio.m,
    right: espacio.m,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espacio.s,
  },
  marca: {
    backgroundColor: colores.fondo,
    borderWidth: tamanos.bordeGrueso,
    borderColor: colores.borde,
    borderRadius: tamanos.radio,
    paddingHorizontal: espacio.m,
    paddingVertical: espacio.xs + 2,
  },
  titulo: {
    fontSize: tipografia.subtitulo,
    fontWeight: tipografia.pesoFuerte,
    color: colores.primario,
  },
  subtituloFragmentos: {
    fontSize: tipografia.pequeno,
    color: colores.textoSuave,
    fontWeight: tipografia.pesoFuerte,
  },
  accionesSuperiores: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.s,
  },
  botonSeguridadRapido: {
    minHeight: tamanos.toqueMinimo,
    paddingHorizontal: espacio.m,
    borderRadius: tamanos.radio,
    backgroundColor: colores.seguridad,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoSeguridadRapido: {
    fontSize: tipografia.pequeno,
    fontWeight: tipografia.pesoFuerte,
    color: colores.textoInverso,
  },
  botonPerfil: {
    width: tamanos.toqueMinimo,
    height: tamanos.toqueMinimo,
    borderRadius: tamanos.radio,
    borderWidth: tamanos.bordeGrueso,
    borderColor: colores.borde,
    backgroundColor: colores.fondo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconoPerfil: { fontSize: tipografia.subtitulo },
  barraInferior: {
    position: 'absolute',
    bottom: espacio.l,
    left: espacio.m,
    right: espacio.m,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  espaciador: { flex: 1 },
  botonFlotante: {
    elevation: 4,
  },
  contenedorModal: {
    flex: 1,
    paddingTop: 32,
    backgroundColor: colores.fondo,
  },
});
