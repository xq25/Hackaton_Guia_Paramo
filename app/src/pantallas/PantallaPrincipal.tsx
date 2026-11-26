import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ResultadoVisita } from '../juego';
import { VistaMapa } from '../mapa';
import { HojaChat } from './chat';
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
    estadoModelo,
    modeloLocalDisponible,
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
  } = usarApp();

  const estacionesOrdenadas = useMemo(
    () => [...paquete.estaciones].sort((a, b) => a.orden - b.orden),
    [paquete.estaciones]
  );

  const [indiceCaminante, setIndiceCaminante] = useState(0);
  const [estacionPanelId, setEstacionPanelId] = useState<string | null>(null);
  const [estacionChatId, setEstacionChatId] = useState<string | null>(null);
  const [hojaActiva, setHojaActiva] = useState<HojaActiva>('ninguna');
  const [recompensaActiva, setRecompensaActiva] = useState<ResultadoVisita | null>(null);

  const estacionSimulada = estacionesOrdenadas[indiceCaminante] ?? estacionesOrdenadas[0] ?? null;

  const estacionSeleccionada = useMemo(
    () => paquete.estaciones.find((e) => e.id === estacionPanelId) ?? null,
    [paquete.estaciones, estacionPanelId]
  );

  const estacionesVisitadasIds = useMemo(
    () =>
      estacionesOrdenadas
        .filter((e) => progreso.estacionVisitada(estadoProgreso, e.id))
        .map((e) => e.id),
    [estacionesOrdenadas, progreso, estadoProgreso]
  );

  const visitadasSet = useMemo(() => new Set(estacionesVisitadasIds), [estacionesVisitadasIds]);
  const todasVisitadas = estacionesOrdenadas.length > 0 && estacionesVisitadasIds.length === estacionesOrdenadas.length;

  const abrirChatEnEstacion = (estacionId: string | null) => {
    setEstacionPanelId(null);
    setEstacionChatId(estacionId);
    setHojaActiva('chat');
  };

  const manejarLlegadaDemo = async (estacionId: string) => {
    const idx = estacionesOrdenadas.findIndex((e) => e.id === estacionId);
    if (idx >= 0) setIndiceCaminante(idx);
    const resultado = await registrarLlegadaDemo(estacionId);
    setEstacionPanelId(null);
    setRecompensaActiva(resultado);
  };

  // Avanza el caminante simulado a la parada actual (si no se ha visitado) o a la siguiente y registra llegada.
  const simularPasoCaminata = async () => {
    if (estacionesOrdenadas.length === 0) return;
    const actual = estacionesOrdenadas[indiceCaminante];
    let destinoIdx = indiceCaminante;
    if (actual && visitadasSet.has(actual.id)) {
      destinoIdx = (indiceCaminante + 1) % estacionesOrdenadas.length;
    }
    const destino = estacionesOrdenadas[destinoIdx];
    setIndiceCaminante(destinoIdx);
    const resultado = await registrarLlegadaDemo(destino.id);
    if (resultado.nueva) {
      setRecompensaActiva(resultado);
    } else {
      setEstacionPanelId(destino.id);
    }
  };

  const manejarDesbloquearTodo = async () => {
    const resultado = await desbloquearTodoDemo();
    if (estacionesOrdenadas.length > 0) {
      setIndiceCaminante(estacionesOrdenadas.length - 1);
    }
    if (resultado.nueva) {
      setRecompensaActiva(resultado);
    }
  };

  const cerrarEditor = () => {
    refrescarVersionGuion();
    setHojaActiva('ninguna');
  };

  return (
    <View style={estilos.raiz}>
      {/* Mapa principal a pantalla completa con zoom centrado en el sendero */}
      <VistaMapa
        estaciones={estacionesOrdenadas}
        estacionesVisitadasIds={estacionesVisitadasIds}
        estacionSimuladaId={modoDemoActivo ? estacionSimulada?.id ?? null : null}
        alSeleccionarEstacion={(id) => {
          const idx = estacionesOrdenadas.findIndex((e) => e.id === id);
          if (idx >= 0) setIndiceCaminante(idx);
          setHojaActiva('ninguna');
          setEstacionPanelId(id);
        }}
      />

      {/* Barra superior compacta */}
      <View style={estilos.barraSuperior} pointerEvents="box-none">
        <View style={estilos.marca}>
          <Text style={estilos.titulo}>ParamON</Text>
          <Text style={estilos.subtituloFragmentos}>
            v{versionGuion} · {estacionesVisitadasIds.length}/{estacionesOrdenadas.length} paradas
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

      {/* Panel inferior: Simulador de caminata (fuera del parque) + Botón Guía */}
      <View style={estilos.panelInferior} pointerEvents="box-none">
        {modoDemoActivo ? (
          <View style={estilos.cajaSimulador}>
            <View style={estilos.cabeceraSimulador}>
              <Text style={estilos.tituloSimulador} numberOfLines={1}>
                🚶 Simulador: {estacionSimulada ? `${indiceCaminante + 1}. ${estacionSimulada.nombre}` : 'Recorrido'}
              </Text>
              {!todasVisitadas ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Desbloquear todas las estaciones y especies"
                  onPress={manejarDesbloquearTodo}
                  style={estilos.botonDesbloquearTodo}
                >
                  <Text style={estilos.textoDesbloquearTodo}>🔓 Desbloquear todo</Text>
                </Pressable>
              ) : (
                <Text style={estilos.insigniaCompleta}>✓ Todo desbloqueado</Text>
              )}
            </View>

            {/* Tira de las 5 estaciones para saltar o ver cada parada */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={estilos.tiraParadas}
            >
              {estacionesOrdenadas.map((est, idx) => {
                const esActual = idx === indiceCaminante;
                const visitada = visitadasSet.has(est.id);
                return (
                  <Pressable
                    key={est.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Ir a ${est.nombre}`}
                    onPress={() => {
                      setIndiceCaminante(idx);
                      setEstacionPanelId(est.id);
                    }}
                    style={[
                      estilos.pastillaParada,
                      visitada && estilos.pastillaVisitada,
                      esActual && estilos.pastillaActual,
                    ]}
                  >
                    <Text
                      style={[
                        estilos.textoPastilla,
                        esActual && estilos.textoPastillaActual,
                      ]}
                    >
                      {visitada ? '✓ ' : `${idx + 1}. `}
                      {est.nombre}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={estilos.filaAccionesInferior}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Simular caminata y registrar llegada"
                onPress={simularPasoCaminata}
                style={estilos.botonCaminar}
              >
                <Text style={estilos.textoBotonCaminar}>
                  {estacionSimulada && !visitadasSet.has(estacionSimulada.id)
                    ? `📍 Llegar a ${estacionSimulada.nombre}`
                    : '🚶 Avanzar parada'}
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Abrir guía virtual"
                onPress={() => abrirChatEnEstacion(estacionSimulada?.id ?? null)}
                style={estilos.botonGuia}
              >
                <Text style={estilos.textoBotonGuia}>💬 Guía</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={estilos.filaSoloGuia}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Abrir guía virtual"
              onPress={() => abrirChatEnEstacion(null)}
              style={estilos.botonGuia}
            >
              <Text style={estilos.textoBotonGuia}>💬 Guía del recorrido</Text>
            </Pressable>
          </View>
        )}
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
        estaciones={estacionesOrdenadas}
        estacionInicialId={estacionChatId}
        orquestador={asistente.orquestador}
        precargarModelo={asistente.precargarModelo}
        liberarModelo={asistente.liberarModelo}
        modeloLocalDisponible={modeloLocalDisponible}
        alAbrirAjustesModelo={() => setHojaActiva('ajustes')}
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
        estadoModelo={estadoModelo}
        alActualizarModelo={refrescarEstadoModelo}
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
    top: 36,
    left: espacio.s + 2,
    right: espacio.s + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espacio.xs + 2,
  },
  marca: {
    flexShrink: 1,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: tamanos.bordeGrueso,
    borderColor: colores.borde,
    borderRadius: tamanos.radio,
    paddingHorizontal: espacio.s + 2,
    paddingVertical: 4,
  },
  titulo: {
    fontSize: 16,
    fontWeight: tipografia.pesoFuerte,
    color: colores.primario,
  },
  subtituloFragmentos: {
    fontSize: 11,
    color: colores.textoSuave,
    fontWeight: tipografia.pesoFuerte,
  },
  accionesSuperiores: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.xs + 2,
  },
  botonSeguridadRapido: {
    height: tamanos.toqueMinimo,
    paddingHorizontal: espacio.s + 2,
    borderRadius: tamanos.radio,
    backgroundColor: colores.seguridad,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoSeguridadRapido: {
    fontSize: 12,
    fontWeight: tipografia.pesoFuerte,
    color: colores.textoInverso,
  },
  botonPerfil: {
    width: tamanos.toqueMinimo,
    height: tamanos.toqueMinimo,
    borderRadius: tamanos.radio,
    borderWidth: tamanos.bordeGrueso,
    borderColor: colores.borde,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconoPerfil: { fontSize: 18 },
  panelInferior: {
    position: 'absolute',
    bottom: espacio.m,
    left: espacio.s + 2,
    right: espacio.s + 2,
  },
  cajaSimulador: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: tamanos.radio + 2,
    borderWidth: tamanos.bordeGrueso,
    borderColor: colores.borde,
    padding: espacio.s + 2,
    gap: espacio.xs + 2,
    elevation: 5,
  },
  cabeceraSimulador: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espacio.s,
  },
  tituloSimulador: {
    flex: 1,
    fontSize: tipografia.pequeno,
    fontWeight: tipografia.pesoFuerte,
    color: colores.texto,
  },
  botonDesbloquearTodo: {
    backgroundColor: colores.acentoSuave,
    borderWidth: 1,
    borderColor: colores.acento,
    borderRadius: 6,
    paddingHorizontal: espacio.s,
    paddingVertical: 3,
  },
  textoDesbloquearTodo: {
    fontSize: 11,
    fontWeight: tipografia.pesoFuerte,
    color: colores.acento,
  },
  insigniaCompleta: {
    fontSize: 11,
    fontWeight: tipografia.pesoFuerte,
    color: colores.visitada,
  },
  tiraParadas: {
    gap: 6,
    paddingVertical: 2,
  },
  pastillaParada: {
    paddingHorizontal: espacio.s + 2,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colores.borde,
    backgroundColor: colores.superficie,
  },
  pastillaVisitada: {
    backgroundColor: colores.primarioSuave,
    borderColor: colores.visitada,
  },
  pastillaActual: {
    backgroundColor: colores.aviso,
    borderColor: colores.aviso,
  },
  textoPastilla: {
    fontSize: 12,
    fontWeight: tipografia.pesoFuerte,
    color: colores.texto,
  },
  textoPastillaActual: {
    color: colores.textoInverso,
  },
  filaAccionesInferior: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.s,
  },
  botonCaminar: {
    flex: 1,
    minHeight: 42,
    backgroundColor: colores.aviso,
    borderRadius: tamanos.radio,
    paddingHorizontal: espacio.s + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoBotonCaminar: {
    fontSize: tipografia.pequeno,
    fontWeight: tipografia.pesoFuerte,
    color: colores.textoInverso,
  },
  botonGuia: {
    minHeight: 42,
    paddingHorizontal: espacio.m + 2,
    backgroundColor: colores.primario,
    borderRadius: tamanos.radio,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoBotonGuia: {
    fontSize: tipografia.cuerpo,
    fontWeight: tipografia.pesoFuerte,
    color: colores.textoInverso,
  },
  filaSoloGuia: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  contenedorModal: {
    flex: 1,
    paddingTop: 28,
    backgroundColor: colores.fondo,
  },
});
