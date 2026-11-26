import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import {
  borrarModeloInterno,
  cancelarDescargaModelo,
  descargarModeloLocal,
  importarModeloDesdeCelular,
  MODELOS_DESCARGA,
  type EstadoArchivoModelo,
  type ProgresoDescargaModelo,
} from '../../datos/modeloLocal';
import { Boton, Etiqueta, Hoja } from '../comunes';
import { colores, espacio, tamanos, tipografia } from '../tema';

export interface HojaAjustesProps {
  visible: boolean;
  alCerrar: () => void;
  versionGuion: string;
  geocercaActiva: boolean;
  modoDemoActivo: boolean;
  verificarPinDemo: (pin: string) => boolean;
  alCambiarModoDemo: (activo: boolean) => void;
  alReiniciarProgreso: () => Promise<void> | void;
  estadoModelo?: EstadoArchivoModelo;
  alActualizarModelo?: () => Promise<void> | void;
}

export function HojaAjustes({
  visible,
  alCerrar,
  versionGuion,
  geocercaActiva,
  modoDemoActivo,
  verificarPinDemo,
  alCambiarModoDemo,
  alReiniciarProgreso,
  estadoModelo,
  alActualizarModelo,
}: HojaAjustesProps) {
  const [pin, setPin] = useState('');
  const [mensajePin, setMensajePin] = useState<string | null>(null);
  const [confirmandoReinicio, setConfirmandoReinicio] = useState(false);
  const [mensajeReinicio, setMensajeReinicio] = useState<string | null>(null);

  const [descargandoId, setDescargandoId] = useState<string | null>(null);
  const [progresoDescarga, setProgresoDescarga] = useState<ProgresoDescargaModelo | null>(null);
  const [mensajeModelo, setMensajeModelo] = useState<string | null>(null);

  const activarDemo = () => {
    if (verificarPinDemo(pin)) {
      alCambiarModoDemo(true);
      setPin('');
      setMensajePin(null);
    } else {
      setMensajePin('PIN incorrecto (PIN demo: 2468).');
    }
  };

  const ejecutarReinicio = async () => {
    await alReiniciarProgreso();
    setConfirmandoReinicio(false);
    setMensajeReinicio('Progreso local reiniciado.');
  };

  const iniciarDescargaModelo = async (id: string, url: string) => {
    setDescargandoId(id);
    setMensajeModelo(null);
    setProgresoDescarga({ escritosMb: 0, totalMb: null, fraccion: 0 });
    try {
      await descargarModeloLocal(url, (p) => setProgresoDescarga(p));
      await alActualizarModelo?.();
      setMensajeModelo('✅ Modelo descargado y activado en llama.rn. Ya puedes activar Modo Avión.');
    } catch (err) {
      setMensajeModelo(
        err instanceof Error
          ? `No se completó la descarga: ${err.message}`
          : 'No se pudo descargar el modelo.'
      );
    } finally {
      setDescargandoId(null);
      setProgresoDescarga(null);
    }
  };

  const elegirArchivoCelular = async () => {
    setMensajeModelo(null);
    try {
      const ok = await importarModeloDesdeCelular();
      if (ok) {
        await alActualizarModelo?.();
        setMensajeModelo('✅ Archivo .gguf copiado y activado en llama.rn.');
      }
    } catch (err) {
      setMensajeModelo(
        err instanceof Error
          ? `No se pudo copiar el archivo: ${err.message}`
          : 'Error al leer el archivo .gguf.'
      );
    }
  };

  const eliminarModelo = async () => {
    borrarModeloInterno();
    await alActualizarModelo?.();
    setMensajeModelo('Modelo local eliminado. El guía usará el texto directo del guion.');
  };

  const pct = Math.round((progresoDescarga?.fraccion ?? 0) * 100);

  return (
    <Hoja visible={visible} alCerrar={alCerrar} titulo="Ajustes y preparar salida" altoMaximo={0.9}>
      {/* 1. Preparar salida: Modelo IA local (llama.rn) */}
      <View style={estilos.bloque}>
        <View style={estilos.filaTitulo}>
          <Text style={estilos.subtitulo}>🤖 Modelo IA local (llama.rn)</Text>
          <Etiqueta
            texto={
              estadoModelo?.disponible
                ? `Activo (${estadoModelo.tamanoMb ?? '?'} MB)`
                : 'Sin .gguf'
            }
            variante={estadoModelo?.disponible ? 'info' : 'neutra'}
          />
        </View>
        <Text style={estilos.ayuda}>
          Descarga el modelo con Wi-Fi antes de salir al páramo (o elige un archivo .gguf ya descargado en tu celular). Luego funciona 100% en Modo Avión.
        </Text>

        {descargandoId ? (
          <View style={estilos.cajaProgreso}>
            <Text style={estilos.valorCampo}>
              Descargando… {pct}% ({progresoDescarga?.escritosMb ?? 0}
              {progresoDescarga?.totalMb ? ` / ${progresoDescarga.totalMb}` : ''} MB)
            </Text>
            <View style={estilos.barraFondo}>
              <View style={[estilos.barraRelleno, { width: `${pct}%` }]} />
            </View>
            <Boton
              titulo="Cancelar descarga"
              variante="secundario"
              alPresionar={() => {
                cancelarDescargaModelo().catch(() => undefined);
                setDescargandoId(null);
                setProgresoDescarga(null);
                setMensajeModelo('Descarga cancelada.');
              }}
            />
          </View>
        ) : (
          <View style={estilos.listaModelos}>
            {MODELOS_DESCARGA.map((m) => (
              <View key={m.id} style={estilos.tarjetaModelo}>
                <Text style={estilos.valorCampo}>{m.nombre}</Text>
                <Text style={estilos.ayuda}>{m.descripcion}</Text>
                <Boton
                  titulo={`⬇ Descargar (${m.tamanoAproxMb} MB)`}
                  variante={m.id === 'qwen' ? 'primario' : 'secundario'}
                  alPresionar={() => iniciarDescargaModelo(m.id, m.url)}
                />
              </View>
            ))}

            <Boton
              titulo="📂 Elegir .gguf desde Descargas del celular"
              variante="secundario"
              alPresionar={elegirArchivoCelular}
            />

            {estadoModelo?.disponible ? (
              <Boton
                titulo="Borrar modelo .gguf guardado"
                variante="seguridad"
                alPresionar={eliminarModelo}
              />
            ) : null}
          </View>
        )}

        {mensajeModelo ? <Text style={estilos.confirmacion}>{mensajeModelo}</Text> : null}
      </View>

      {/* 2. Versión del guion y estado de la geocerca */}
      <View style={estilos.bloque}>
        <Text style={estilos.etiquetaCampo}>Versión del guion</Text>
        <Text style={estilos.valorCampo}>{versionGuion}</Text>
        <View style={estilos.separador} />
        <Text style={estilos.etiquetaCampo}>Zona del recorrido</Text>
        <Text style={estilos.valorCampo}>
          {geocercaActiva
            ? 'Restricción de zona: activa'
            : 'Restricción de zona: desactivada (modo pruebas)'}
        </Text>
      </View>

      {/* 3. Modo simulador / demo */}
      <View style={estilos.bloque}>
        <View style={estilos.filaTitulo}>
          <Text style={estilos.subtitulo}>Simulador / Modo demo</Text>
          <Etiqueta
            texto={modoDemoActivo ? 'Activo' : 'Inactivo'}
            variante={modoDemoActivo ? 'aviso' : 'neutra'}
          />
        </View>
        <Text style={estilos.ayuda}>
          Muestra el simulador de caminata en el mapa para probar fuera del parque.
        </Text>

        {modoDemoActivo ? (
          <Boton
            titulo="Ocultar simulador demo"
            variante="secundario"
            alPresionar={() => {
              alCambiarModoDemo(false);
              setMensajePin(null);
            }}
          />
        ) : (
          <View style={estilos.filaPin}>
            <TextInput
              value={pin}
              onChangeText={(t) => {
                setPin(t);
                setMensajePin(null);
              }}
              placeholder="PIN demo (2468)"
              placeholderTextColor={colores.textoSuave}
              keyboardType="number-pad"
              secureTextEntry
              style={estilos.cajaPin}
              accessibilityLabel="PIN de modo demo"
            />
            <Boton
              titulo="Activar"
              variante="aviso"
              deshabilitado={pin.trim().length === 0}
              alPresionar={activarDemo}
            />
          </View>
        )}

        {mensajePin ? <Text style={estilos.aviso}>{mensajePin}</Text> : null}
      </View>

      {/* 4. Reiniciar progreso local */}
      <View style={estilos.bloque}>
        <Text style={estilos.subtitulo}>Progreso en este celular</Text>
        <Text style={estilos.ayuda}>
          Borra las visitas, cartas desbloqueadas e insignias guardadas de forma anónima.
        </Text>

        {confirmandoReinicio ? (
          <View style={estilos.filaConfirmar}>
            <Boton
              titulo="Sí, reiniciar"
              variante="seguridad"
              alPresionar={ejecutarReinicio}
              estilo={estilos.botonMitad}
            />
            <Boton
              titulo="Cancelar"
              variante="secundario"
              alPresionar={() => setConfirmandoReinicio(false)}
              estilo={estilos.botonMitad}
            />
          </View>
        ) : (
          <Boton
            titulo="Reiniciar progreso"
            variante="secundario"
            alPresionar={() => {
              setMensajeReinicio(null);
              setConfirmandoReinicio(true);
            }}
          />
        )}

        {mensajeReinicio ? <Text style={estilos.confirmacion}>{mensajeReinicio}</Text> : null}
      </View>
    </Hoja>
  );
}

const estilos = StyleSheet.create({
  bloque: {
    backgroundColor: colores.superficie,
    borderRadius: tamanos.radio,
    borderWidth: 1,
    borderColor: colores.borde,
    padding: espacio.m,
    gap: espacio.s,
  },
  listaModelos: { gap: espacio.s },
  tarjetaModelo: {
    backgroundColor: colores.fondo,
    borderRadius: tamanos.radio,
    borderWidth: 1,
    borderColor: colores.bloqueada,
    padding: espacio.s + 2,
    gap: 6,
  },
  cajaProgreso: {
    backgroundColor: colores.fondo,
    borderRadius: tamanos.radio,
    padding: espacio.m,
    gap: espacio.s,
  },
  barraFondo: {
    height: 12,
    borderRadius: 6,
    backgroundColor: colores.bloqueada,
    overflow: 'hidden',
  },
  barraRelleno: {
    height: '100%',
    backgroundColor: colores.primario,
  },
  separador: { height: 1, backgroundColor: colores.bloqueada, marginVertical: espacio.xs },
  etiquetaCampo: {
    fontSize: tipografia.pequeno,
    fontWeight: tipografia.pesoFuerte,
    color: colores.textoSuave,
  },
  valorCampo: {
    fontSize: tipografia.cuerpo,
    fontWeight: tipografia.pesoFuerte,
    color: colores.texto,
  },
  filaTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espacio.s,
  },
  subtitulo: {
    flex: 1,
    fontSize: tipografia.subtitulo,
    fontWeight: tipografia.pesoFuerte,
    color: colores.texto,
  },
  ayuda: {
    fontSize: tipografia.pequeno,
    lineHeight: 19,
    color: colores.textoSuave,
  },
  filaPin: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.s,
  },
  cajaPin: {
    flex: 1,
    minHeight: tamanos.botonAlto,
    backgroundColor: colores.fondo,
    borderWidth: tamanos.bordeGrueso,
    borderColor: colores.borde,
    borderRadius: tamanos.radio,
    paddingHorizontal: espacio.m,
    fontSize: tipografia.cuerpo,
    color: colores.texto,
  },
  aviso: {
    fontSize: tipografia.pequeno,
    fontWeight: tipografia.pesoFuerte,
    color: colores.aviso,
  },
  filaConfirmar: { flexDirection: 'row', gap: espacio.s },
  botonMitad: { flex: 1 },
  confirmacion: {
    fontSize: tipografia.pequeno,
    fontWeight: tipografia.pesoFuerte,
    color: colores.primario,
  },
});
