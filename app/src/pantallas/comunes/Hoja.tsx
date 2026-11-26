import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { colores, espacio, tamanos, tipografia } from '../tema';

export interface HojaProps {
  visible: boolean;
  alCerrar: () => void;
  titulo?: string;
  /** Alto máximo como fracción de la pantalla (0–1). Por defecto 0.88. */
  altoMaximo?: number;
  /** false si el contenido maneja su propio scroll (p. ej. la lista de mensajes del chat). */
  desplazable?: boolean;
  /** Se muestra fijo abajo, fuera del scroll (p. ej. la caja de texto del chat). */
  pie?: ReactNode;
  children: ReactNode;
}

/** Hoja inferior encima del mapa (panel de estación, chat, menú, fichas). */
export function Hoja({
  visible,
  alCerrar,
  titulo,
  altoMaximo = 0.88,
  desplazable = true,
  pie,
  children,
}: HojaProps) {
  const { height: altoVentana } = useWindowDimensions();
  const altoPx = Math.max(320, Math.round(altoVentana * altoMaximo));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={alCerrar}
    >
      <KeyboardAvoidingView
        style={estilos.contenedor}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={estilos.velo} onPress={alCerrar} accessibilityLabel="Cerrar" />
        <View
          style={[
            estilos.hoja,
            desplazable ? { maxHeight: altoPx } : { height: altoPx },
          ]}
        >
          <View style={estilos.agarradera} />
          <View style={estilos.encabezado}>
            <Text style={estilos.titulo} numberOfLines={1} accessibilityRole="header">
              {titulo ?? ''}
            </Text>
            <Pressable
              onPress={alCerrar}
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
              hitSlop={12}
              style={estilos.cerrar}
            >
              <Text style={estilos.cerrarTexto}>✕</Text>
            </Pressable>
          </View>
          {desplazable ? (
            <ScrollView
              contentContainerStyle={estilos.contenido}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>
          ) : (
            <View style={[estilos.contenidoFijo, estilos.flexible]}>{children}</View>
          )}
          {pie ? <View style={estilos.pie}>{pie}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, justifyContent: 'flex-end' },
  velo: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colores.velo,
  },
  hoja: {
    backgroundColor: colores.fondo,
    borderTopLeftRadius: tamanos.radioHoja,
    borderTopRightRadius: tamanos.radioHoja,
    paddingBottom: espacio.m,
  },
  agarradera: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colores.bloqueada,
    marginTop: espacio.xs + 2,
  },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: espacio.m,
    paddingVertical: espacio.xs,
    borderBottomWidth: 1,
    borderBottomColor: colores.superficie,
  },
  titulo: {
    flex: 1,
    fontSize: tipografia.subtitulo,
    fontWeight: tipografia.pesoFuerte,
    color: colores.texto,
  },
  cerrar: {
    width: tamanos.toqueMinimo,
    height: tamanos.toqueMinimo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cerrarTexto: {
    fontSize: tipografia.subtitulo,
    color: colores.texto,
    fontWeight: tipografia.pesoFuerte,
  },
  contenido: {
    paddingHorizontal: espacio.m,
    paddingTop: espacio.s,
    paddingBottom: espacio.m,
    gap: espacio.m,
  },
  contenidoFijo: {
    paddingHorizontal: espacio.m,
    paddingTop: espacio.s,
    gap: espacio.s,
  },
  flexible: {
    flex: 1,
    minHeight: 0,
  },
  pie: {
    paddingHorizontal: espacio.m,
    paddingTop: espacio.s,
    borderTopWidth: 1,
    borderTopColor: colores.superficie,
  },
});
