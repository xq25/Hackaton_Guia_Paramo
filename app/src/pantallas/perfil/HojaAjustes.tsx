import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
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
}: HojaAjustesProps) {
  const [pin, setPin] = useState('');
  const [mensajePin, setMensajePin] = useState<string | null>(null);
  const [confirmandoReinicio, setConfirmandoReinicio] = useState(false);
  const [mensajeReinicio, setMensajeReinicio] = useState<string | null>(null);

  const activarDemo = () => {
    if (verificarPinDemo(pin)) {
      alCambiarModoDemo(true);
      setPin('');
      setMensajePin(null);
    } else {
      setMensajePin('PIN incorrecto. Verifica con el equipo de demostración.');
    }
  };

  const ejecutarReinicio = async () => {
    await alReiniciarProgreso();
    setConfirmandoReinicio(false);
    setMensajeReinicio('Progreso local reiniciado.');
  };

  return (
    <Hoja visible={visible} alCerrar={alCerrar} titulo="Ajustes" altoMaximo={0.88}>
      {/* Versión del guion y estado de la geocerca */}
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

      {/* Modo demo con PIN */}
      <View style={estilos.bloque}>
        <View style={estilos.filaTitulo}>
          <Text style={estilos.subtitulo}>Modo demostración</Text>
          <Etiqueta
            texto={modoDemoActivo ? 'Activo' : 'Inactivo'}
            variante={modoDemoActivo ? 'aviso' : 'neutra'}
          />
        </View>
        <Text style={estilos.ayuda}>
          Permite simular la llegada a las estaciones durante presentaciones fuera del parque.
        </Text>

        {modoDemoActivo ? (
          <Boton
            titulo="Desactivar modo demo"
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
              placeholder="PIN de demostración"
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

      {/* Reiniciar progreso local */}
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
    fontSize: tipografia.subtitulo,
    fontWeight: tipografia.pesoFuerte,
    color: colores.texto,
  },
  ayuda: {
    fontSize: tipografia.pequeno,
    lineHeight: 22,
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
