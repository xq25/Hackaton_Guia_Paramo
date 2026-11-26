import { type ComponentRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  MotivoLimite,
  Nivel,
  TipoRespuesta,
  type Estacion,
  type OrquestadorRespuestas,
  type Respuesta,
} from '../../dominio/modelo';
import { Boton, Etiqueta, Hoja } from '../comunes';
import { colores, espacio, tamanos, tipografia } from '../tema';
import { esRespuestaLimite, formatearCita, orquestadorMaqueta, sugerenciasRecorrido } from './formatoChat';

export interface HojaChatProps {
  visible: boolean;
  alCerrar: () => void;
  estaciones: Estacion[];
  estacionInicialId?: string | null;
  /** Entregado por crearAsistente (B) tras S1. Si falta, usa la maqueta local. */
  orquestador?: OrquestadorRespuestas;
  precargarModelo?: () => Promise<void>;
  liberarModelo?: () => Promise<void>;
  alAbrirSeguridad?: () => void;
}

interface MensajeChat {
  id: string;
  rol: 'visitante' | 'guia';
  textoPregunta: string;
  estacionId: string | null;
  nivel: Nivel;
  respuesta?: Respuesta;
  ampliadoUsado?: boolean;
}

export function HojaChat({
  visible,
  alCerrar,
  estaciones,
  estacionInicialId = null,
  orquestador = orquestadorMaqueta,
  precargarModelo,
  liberarModelo,
  alAbrirSeguridad,
}: HojaChatProps) {
  const [estacionId, setEstacionId] = useState<string | null>(estacionInicialId);
  const [entrada, setEntrada] = useState('');
  const [pensando, setPensando] = useState(false);
  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const scrollRef = useRef<ComponentRef<typeof ScrollView> | null>(null);
  const secRef = useRef(1);

  // Sincroniza la estación elegida al abrir desde un panel de estación.
  useEffect(() => {
    if (visible) {
      setEstacionId(estacionInicialId ?? null);
    }
  }, [visible, estacionInicialId]);

  // Precarga perezosa al abrir el chat y liberación al pasar a segundo plano (C3).
  useEffect(() => {
    if (visible && precargarModelo) {
      precargarModelo().catch(() => undefined);
    }
  }, [visible, precargarModelo]);

  useEffect(() => {
    if (!liberarModelo) return;
    const sub = AppState.addEventListener('change', (estado) => {
      if (estado === 'background') {
        liberarModelo().catch(() => undefined);
      }
    });
    return () => sub.remove();
  }, [liberarModelo]);

  const estacionesOrdenadas = useMemo(
    () => [...estaciones].sort((a, b) => a.orden - b.orden),
    [estaciones]
  );

  const estacionActual = useMemo(
    () => estacionesOrdenadas.find((e) => e.id === estacionId) ?? null,
    [estacionesOrdenadas, estacionId]
  );

  const sugerencias = useMemo(
    () => (estacionActual ? estacionActual.preguntasSugeridas : sugerenciasRecorrido(estacionesOrdenadas)),
    [estacionActual, estacionesOrdenadas]
  );

  const enviarPregunta = useCallback(
    async (textoCrudo: string, nivel: Nivel, idOrigenAmpliar?: string, estacionForzada?: string | null) => {
      const limpio = textoCrudo.trim();
      if (!limpio || pensando) return;

      const estConsulta = estacionForzada !== undefined ? estacionForzada : estacionId;

      if (idOrigenAmpliar) {
        setMensajes((prev) =>
          prev.map((m) => (m.id === idOrigenAmpliar ? { ...m, ampliadoUsado: true } : m))
        );
      } else {
        const idPregunta = `m-${secRef.current++}`;
        setMensajes((prev) => [
          ...prev,
          { id: idPregunta, rol: 'visitante', textoPregunta: limpio, estacionId: estConsulta, nivel },
        ]);
        setEntrada('');
      }

      setPensando(true);
      try {
        const resp = await orquestador.responder(limpio, estConsulta, nivel);
        const idResp = `m-${secRef.current++}`;
        setMensajes((prev) => [
          ...prev,
          {
            id: idResp,
            rol: 'guia',
            textoPregunta: limpio,
            estacionId: estConsulta,
            nivel,
            respuesta: resp,
          },
        ]);
      } finally {
        setPensando(false);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
      }
    },
    [estacionId, orquestador, pensando]
  );

  const pie = (
    <View style={estilos.barraEntrada}>
      <TextInput
        value={entrada}
        onChangeText={setEntrada}
        placeholder="Escribe tu pregunta sobre el guion…"
        placeholderTextColor={colores.textoSuave}
        editable={!pensando}
        returnKeyType="send"
        onSubmitEditing={() => enviarPregunta(entrada, Nivel.BREVE)}
        style={estilos.cajaTexto}
        accessibilityLabel="Pregunta para el guía"
      />
      <Boton
        titulo="Enviar"
        alPresionar={() => enviarPregunta(entrada, Nivel.BREVE)}
        deshabilitado={pensando || entrada.trim().length === 0}
        estilo={estilos.botonEnviar}
      />
    </View>
  );

  return (
    <Hoja
      visible={visible}
      alCerrar={alCerrar}
      titulo="💬 Guía del recorrido"
      altoMaximo={0.9}
      desplazable={false}
      pie={pie}
    >
      {/* Selector de estación o "Todo el recorrido" */}
      <View style={estilos.bloqueSelector}>
        <Text style={estilos.etiquetaSeccion}>Estación:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.filaChips}>
          <ChipEstacion
            texto="Todo el recorrido"
            activo={estacionId === null}
            alPresionar={() => setEstacionId(null)}
          />
          {estacionesOrdenadas.map((e) => (
            <ChipEstacion
              key={e.id}
              texto={e.nombre}
              activo={estacionId === e.id}
              alPresionar={() => setEstacionId(e.id)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Lista de mensajes y sugerencias */}
      <ScrollView
        ref={scrollRef}
        style={estilos.lista}
        contentContainerStyle={estilos.listaContenido}
        keyboardShouldPersistTaps="handled"
      >
        {sugerencias.length > 0 ? (
          <View style={estilos.bloqueSugerencias}>
            <Text style={estilos.etiquetaSeccion}>Preguntas sugeridas:</Text>
            {sugerencias.map((pregunta) => (
              <Pressable
                key={pregunta}
                accessibilityRole="button"
                accessibilityLabel={`Preguntar: ${pregunta}`}
                disabled={pensando}
                onPress={() => enviarPregunta(pregunta, Nivel.BREVE)}
                style={({ pressed }) => [
                  estilos.botonSugerencia,
                  pressed && estilos.presionado,
                  pensando && estilos.deshabilitado,
                ]}
              >
                <Text style={estilos.textoSugerencia}>{pregunta}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {mensajes.map((m) =>
          m.rol === 'visitante' ? (
            <View key={m.id} style={estilos.burbujaVisitante}>
              <Text style={estilos.textoVisitante}>{m.textoPregunta}</Text>
            </View>
          ) : m.respuesta ? (
            <TarjetaRespuesta
              key={m.id}
              mensaje={m}
              respuesta={m.respuesta}
              pensando={pensando}
              alAmpliar={() =>
                enviarPregunta(m.textoPregunta, Nivel.AMPLIADO, m.id, m.estacionId)
              }
              alAbrirSeguridad={alAbrirSeguridad}
            />
          ) : null
        )}

        {pensando ? (
          <View style={estilos.pensando} accessibilityLiveRegion="polite">
            <ActivityIndicator color={colores.primario} />
            <Text style={estilos.pensandoTexto}>Pensando…</Text>
          </View>
        ) : null}
      </ScrollView>
    </Hoja>
  );
}

function ChipEstacion({
  texto,
  activo,
  alPresionar,
}: {
  texto: string;
  activo: boolean;
  alPresionar: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: activo }}
      onPress={alPresionar}
      style={[estilos.chip, activo && estilos.chipActivo]}
    >
      <Text style={[estilos.chipTexto, activo && estilos.chipTextoActivo]}>{texto}</Text>
    </Pressable>
  );
}

function TarjetaRespuesta({
  mensaje,
  respuesta,
  pensando,
  alAmpliar,
  alAbrirSeguridad,
}: {
  mensaje: MensajeChat;
  respuesta: Respuesta;
  pensando: boolean;
  alAmpliar: () => void;
  alAbrirSeguridad?: () => void;
}) {
  const esLimite = esRespuestaLimite(respuesta.tipo);

  return (
    <View style={[estilos.burbujaGuia, esLimite && estilos.burbujaLimite]}>
      {esLimite ? (
        <Etiqueta
          texto={
            respuesta.tipo === TipoRespuesta.REMISION_AL_PERSONAL
              ? 'Consulta al personal del parque'
              : 'Fuera del guion'
          }
          variante="aviso"
        />
      ) : null}

      {respuesta.tipo === TipoRespuesta.CON_DIFERENCIA_ENTRE_FUENTES ? (
        <Etiqueta texto="Diferencia entre fuentes oficiales" variante="acento" />
      ) : null}

      <Text style={[estilos.textoGuia, esLimite && estilos.textoLimite]}>{respuesta.texto}</Text>

      {respuesta.advertencias.length > 0 ? (
        <View style={estilos.filaEtiquetas}>
          {respuesta.advertencias.map((adv) => (
            <Etiqueta key={adv} texto={adv} variante="acento" />
          ))}
        </View>
      ) : null}

      {respuesta.citas.length > 0 ? (
        <View style={estilos.bloqueCitas}>
          {respuesta.citas.map((cita, idx) => (
            <Text key={`${cita.guionTitulo}-${cita.pagina}-${idx}`} style={estilos.textoCita}>
              📖 {formatearCita(cita)}
            </Text>
          ))}
        </View>
      ) : null}

      {respuesta.ampliable && !mensaje.ampliadoUsado ? (
        <Boton
          titulo="Contarme más"
          variante="secundario"
          deshabilitado={pensando}
          alPresionar={alAmpliar}
          estilo={estilos.botonAccion}
        />
      ) : null}

      {respuesta.motivo === MotivoLimite.EMERGENCIA && alAbrirSeguridad ? (
        <Boton
          titulo="Ver protocolo de seguridad"
          variante="seguridad"
          alPresionar={alAbrirSeguridad}
          estilo={estilos.botonAccion}
        />
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  bloqueSelector: { gap: espacio.xs },
  etiquetaSeccion: {
    fontSize: tipografia.pequeno,
    fontWeight: tipografia.pesoFuerte,
    color: colores.textoSuave,
  },
  filaChips: { gap: espacio.s, paddingVertical: espacio.xs },
  chip: {
    minHeight: tamanos.toqueMinimo,
    paddingHorizontal: espacio.m,
    borderRadius: 999,
    borderWidth: tamanos.bordeGrueso,
    borderColor: colores.borde,
    backgroundColor: colores.fondo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActivo: {
    backgroundColor: colores.primario,
    borderColor: colores.primario,
  },
  chipTexto: {
    fontSize: tipografia.pequeno,
    fontWeight: tipografia.pesoFuerte,
    color: colores.texto,
  },
  chipTextoActivo: { color: colores.textoInverso },
  lista: { flex: 1 },
  listaContenido: { gap: espacio.m, paddingBottom: espacio.m },
  bloqueSugerencias: { gap: espacio.s },
  botonSugerencia: {
    minHeight: tamanos.toqueMinimo,
    paddingHorizontal: espacio.m,
    paddingVertical: espacio.s,
    borderRadius: tamanos.radio,
    borderWidth: 1,
    borderColor: colores.primario,
    backgroundColor: colores.primarioSuave,
    justifyContent: 'center',
  },
  textoSugerencia: {
    fontSize: tipografia.pequeno,
    fontWeight: tipografia.pesoFuerte,
    color: colores.primario,
  },
  presionado: { opacity: 0.8 },
  deshabilitado: { opacity: 0.5 },
  burbujaVisitante: {
    alignSelf: 'flex-end',
    maxWidth: '88%',
    backgroundColor: colores.primario,
    borderRadius: tamanos.radio,
    padding: espacio.m,
  },
  textoVisitante: {
    fontSize: tipografia.cuerpo,
    lineHeight: tipografia.interlineado,
    color: colores.textoInverso,
    fontWeight: tipografia.pesoFuerte,
  },
  burbujaGuia: {
    alignSelf: 'stretch',
    backgroundColor: colores.superficie,
    borderRadius: tamanos.radio,
    borderWidth: tamanos.bordeGrueso,
    borderColor: colores.borde,
    padding: espacio.m,
    gap: espacio.s,
  },
  burbujaLimite: {
    backgroundColor: colores.avisoSuave,
    borderColor: colores.aviso,
  },
  textoGuia: {
    fontSize: tipografia.cuerpo,
    lineHeight: tipografia.interlineado,
    color: colores.texto,
  },
  textoLimite: {
    color: colores.aviso,
    fontWeight: tipografia.pesoFuerte,
  },
  filaEtiquetas: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.xs },
  bloqueCitas: {
    borderTopWidth: 1,
    borderTopColor: colores.bloqueada,
    paddingTop: espacio.s,
    gap: espacio.xs,
  },
  textoCita: {
    fontSize: tipografia.pequeno,
    fontWeight: tipografia.pesoFuerte,
    color: colores.textoSuave,
  },
  botonAccion: { alignSelf: 'flex-start', marginTop: espacio.xs },
  pensando: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.s,
    padding: espacio.s,
  },
  pensandoTexto: {
    fontSize: tipografia.cuerpo,
    fontWeight: tipografia.pesoFuerte,
    color: colores.primario,
  },
  barraEntrada: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.s,
  },
  cajaTexto: {
    flex: 1,
    minHeight: tamanos.botonAlto,
    borderWidth: tamanos.bordeGrueso,
    borderColor: colores.borde,
    borderRadius: tamanos.radio,
    paddingHorizontal: espacio.m,
    fontSize: tipografia.cuerpo,
    color: colores.texto,
    backgroundColor: colores.fondo,
  },
  botonEnviar: { paddingHorizontal: espacio.m },
});
