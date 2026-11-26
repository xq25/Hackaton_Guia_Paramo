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
import {
  esRespuestaLimite,
  formatearCita,
  orquestadorMaqueta,
  sugerenciasRecorrido,
} from './formatoChat';

export interface HojaChatProps {
  visible: boolean;
  alCerrar: () => void;
  estaciones: Estacion[];
  estacionInicialId?: string | null;
  orquestador?: OrquestadorRespuestas;
  precargarModelo?: () => Promise<void>;
  liberarModelo?: () => Promise<void>;
  /** Indica si el archivo modelo.gguf está presente en el almacenamiento del celular. */
  modeloLocalDisponible?: boolean;
  alAbrirAjustesModelo?: () => void;
  alAbrirSeguridad?: () => void;
  alAbrirAlbum?: () => void;
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

function etiquetaModoRespuesta(r: Respuesta): string {
  switch (r.tipo) {
    case TipoRespuesta.RESPONDIDA:
      return `🤖 IA local · ${r.tiempoMs} ms`;
    case TipoRespuesta.RESPALDO_SIN_MODELO:
      return `📖 Guion oficial · ${r.tiempoMs} ms`;
    case TipoRespuesta.CON_DIFERENCIA_ENTRE_FUENTES:
      return `⚖️ Comparación de guiones · ${r.tiempoMs} ms`;
    case TipoRespuesta.REMISION_AL_PERSONAL:
      return `🛡️ Filtro de seguridad · ${r.tiempoMs} ms`;
    case TipoRespuesta.ABSTENCION:
      return `ℹ️ Fuera del guion · ${r.tiempoMs} ms`;
  }
}

export function HojaChat({
  visible,
  alCerrar,
  estaciones,
  estacionInicialId = null,
  orquestador = orquestadorMaqueta,
  precargarModelo,
  liberarModelo,
  modeloLocalDisponible = false,
  alAbrirAjustesModelo,
  alAbrirSeguridad,
  alAbrirAlbum,
}: HojaChatProps) {
  const [estacionId, setEstacionId] = useState<string | null>(estacionInicialId);
  const [entrada, setEntrada] = useState('');
  const [pensando, setPensando] = useState(false);
  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(true);
  const scrollRef = useRef<ComponentRef<typeof ScrollView> | null>(null);
  const secRef = useRef(1);

  useEffect(() => {
    if (visible) {
      setEstacionId(estacionInicialId ?? null);
    }
  }, [visible, estacionInicialId]);

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
    () =>
      estacionActual
        ? estacionActual.preguntasSugeridas
        : sugerenciasRecorrido(estacionesOrdenadas),
    [estacionActual, estacionesOrdenadas]
  );

  const enviarPregunta = useCallback(
    async (
      textoCrudo: string,
      nivel: Nivel,
      idOrigenAmpliar?: string,
      estacionForzada?: string | null
    ) => {
      const limpio = textoCrudo.trim();
      if (!limpio || pensando) return;

      const estConsulta = estacionForzada !== undefined ? estacionForzada : estacionId;
      setMostrarSugerencias(false);

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
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 40);

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
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      }
    },
    [estacionId, orquestador, pensando]
  );

  const pie = (
    <View style={estilos.barraEntrada}>
      <TextInput
        value={entrada}
        onChangeText={setEntrada}
        placeholder="Pregunta algo del recorrido…"
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

  const verSugerencias = mensajes.length === 0 || mostrarSugerencias;

  return (
    <Hoja
      visible={visible}
      alCerrar={alCerrar}
      titulo="💬 Guía virtual UTON"
      altoMaximo={0.92}
      desplazable={false}
      pie={pie}
    >
      {/* Estado visible del asistente para verificar funcionamiento en todo momento */}
      <View style={estilos.barraEstado}>
        <Text style={estilos.textoEstado} numberOfLines={1}>
          {modeloLocalDisponible
            ? '🟢 IA local activa (llama.rn + Guion UTON)'
            : '🟢 Guion directo (sin .gguf cargado)'}
        </Text>
        {!modeloLocalDisponible && alAbrirAjustesModelo ? (
          <Pressable
            accessibilityRole="button"
            onPress={alAbrirAjustesModelo}
            style={estilos.botonToggleSug}
          >
            <Text style={estilos.textoToggleSug}>⬇ Cargar IA</Text>
          </Pressable>
        ) : null}
        {mensajes.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setMostrarSugerencias((v) => !v)}
            style={estilos.botonToggleSug}
          >
            <Text style={estilos.textoToggleSug}>
              {verSugerencias ? 'Ocultar sugerencias' : '💡 Sugerencias'}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {/* Selector compacto de estación */}
      <View style={estilos.bloqueSelector}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={estilos.filaChips}
        >
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

      {/* Área amplia de conversación */}
      <ScrollView
        ref={scrollRef}
        style={estilos.lista}
        contentContainerStyle={estilos.listaContenido}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {mensajes.length === 0 ? (
          <View style={estilos.bienvenida}>
            <Text style={estilos.bienvenidaTitulo}>
              ¡Hola! Soy el guía sin señal del recorrido {estacionActual ? `(${estacionActual.nombre})` : 'Brisas – Valle de las Tumbas'}.
            </Text>
            <Text style={estilos.bienvenidaCuerpo}>
              Respondo únicamente con los guiones oficiales UTON e incluyo la página exacta citada. Toca una sugerencia o escribe tu pregunta abajo:
            </Text>
          </View>
        ) : null}

        {verSugerencias && sugerencias.length > 0 ? (
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
                <Text style={estilos.textoSugerencia}>▶ {pregunta}</Text>
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
              alAbrirAlbum={alAbrirAlbum}
            />
          ) : null
        )}

        {pensando ? (
          <View style={estilos.pensando} accessibilityLiveRegion="polite">
            <ActivityIndicator color={colores.primario} />
            <Text style={estilos.pensandoTexto}>Buscando en el guion…</Text>
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
  alAbrirAlbum,
}: {
  mensaje: MensajeChat;
  respuesta: Respuesta;
  pensando: boolean;
  alAmpliar: () => void;
  alAbrirSeguridad?: () => void;
  alAbrirAlbum?: () => void;
}) {
  const esLimite = esRespuestaLimite(respuesta.tipo);

  return (
    <View style={[estilos.burbujaGuia, esLimite && estilos.burbujaLimite]}>
      <View style={estilos.filaEncabezadoResp}>
        <Text style={estilos.modoResp}>{etiquetaModoRespuesta(respuesta)}</Text>
        {esLimite ? (
          <Etiqueta
            texto={
              respuesta.tipo === TipoRespuesta.REMISION_AL_PERSONAL
                ? 'Consulta al personal'
                : 'Fuera del guion'
            }
            variante="aviso"
          />
        ) : null}
        {respuesta.tipo === TipoRespuesta.CON_DIFERENCIA_ENTRE_FUENTES ? (
          <Etiqueta texto="Diferencia entre fuentes" variante="acento" />
        ) : null}
      </View>

      <Text style={[estilos.textoGuia, esLimite && estilos.textoLimite]} selectable>
        {respuesta.texto}
      </Text>

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

      {respuesta.tipo === TipoRespuesta.ABSTENCION &&
      respuesta.motivo === MotivoLimite.SIN_EVIDENCIA &&
      alAbrirAlbum ? (
        <Boton
          titulo="Ver en el álbum"
          icono="📘"
          variante="secundario"
          alPresionar={alAbrirAlbum}
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
  barraEstado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colores.primarioSuave,
    borderRadius: 8,
    paddingHorizontal: espacio.s + 2,
    paddingVertical: espacio.xs + 1,
    gap: espacio.s,
  },
  textoEstado: {
    flex: 1,
    fontSize: 12,
    fontWeight: tipografia.pesoFuerte,
    color: colores.primario,
  },
  botonToggleSug: {
    paddingHorizontal: espacio.s,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: colores.fondo,
    borderWidth: 1,
    borderColor: colores.primario,
  },
  textoToggleSug: {
    fontSize: 12,
    fontWeight: tipografia.pesoFuerte,
    color: colores.primario,
  },
  bloqueSelector: { flexGrow: 0 },
  etiquetaSeccion: {
    fontSize: tipografia.pequeno,
    fontWeight: tipografia.pesoFuerte,
    color: colores.textoSuave,
  },
  filaChips: { gap: espacio.xs + 2, paddingVertical: 2 },
  chip: {
    height: 34,
    paddingHorizontal: espacio.m,
    borderRadius: 999,
    borderWidth: 1.5,
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
  lista: {
    flex: 1,
    minHeight: 0,
  },
  listaContenido: {
    gap: espacio.s + 2,
    paddingVertical: espacio.xs,
    paddingBottom: espacio.m,
  },
  bienvenida: {
    backgroundColor: colores.superficie,
    borderRadius: tamanos.radio,
    borderWidth: 1,
    borderColor: colores.bloqueada,
    padding: espacio.m,
    gap: espacio.xs,
  },
  bienvenidaTitulo: {
    fontSize: tipografia.cuerpo,
    fontWeight: tipografia.pesoFuerte,
    color: colores.primario,
  },
  bienvenidaCuerpo: {
    fontSize: tipografia.pequeno,
    lineHeight: 19,
    color: colores.textoSuave,
  },
  bloqueSugerencias: { gap: espacio.xs + 2 },
  botonSugerencia: {
    paddingHorizontal: espacio.m,
    paddingVertical: espacio.s + 2,
    borderRadius: tamanos.radio,
    borderWidth: 1,
    borderColor: colores.primario,
    backgroundColor: colores.primarioSuave,
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
    paddingHorizontal: espacio.m,
    paddingVertical: espacio.s + 2,
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
  filaEncabezadoResp: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espacio.xs,
  },
  modoResp: {
    fontSize: 12,
    fontWeight: tipografia.pesoFuerte,
    color: colores.textoSuave,
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
    paddingTop: espacio.xs + 2,
    gap: 2,
  },
  textoCita: {
    fontSize: tipografia.pequeno,
    fontWeight: tipografia.pesoFuerte,
    color: colores.primario,
  },
  botonAccion: { alignSelf: 'flex-start', marginTop: 2 },
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
