/**
 * Piezas básicas del editor. Estilo mínimo y provisional: al llegar S10 se reemplazan por
 * `Boton` de pantallas/comunes y los valores de pantallas/tema.ts (solo este archivo cambia).
 */
import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

export const C = {
  fondo: '#FFFFFF', superficie: '#F2F4F1', texto: '#111111', suave: '#3D3D3D', borde: '#1B1B1B',
  primario: '#14532D', primarioSuave: '#DCEFE1', aviso: '#1E3A8A', avisoSuave: '#E3E9FA',
  error: '#B91C1C', errorSuave: '#FDE4E4',
};

export function BotonEditor(props: {
  titulo: string; alPresionar: () => void; variante?: 'primario' | 'secundario' | 'peligro';
  deshabilitado?: boolean;
}) {
  const v = props.variante ?? 'primario';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={props.titulo}
      accessibilityState={{ disabled: !!props.deshabilitado }}
      onPress={props.alPresionar}
      disabled={props.deshabilitado}
      style={({ pressed }) => [
        e.boton,
        v === 'primario' && { backgroundColor: C.primario },
        v === 'peligro' && { backgroundColor: C.error },
        v === 'secundario' && e.botonSecundario,
        (pressed || props.deshabilitado) && { opacity: 0.6 },
      ]}
    >
      <Text style={[e.textoBoton, v === 'secundario' && { color: C.texto }]}>{props.titulo}</Text>
    </Pressable>
  );
}

/** Opción seleccionable (estación, tipo, tema…). */
export function Opcion(props: { etiqueta: string; elegida: boolean; alElegir: () => void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: props.elegida }}
      onPress={props.alElegir}
      style={[e.opcion, props.elegida && e.opcionElegida]}
    >
      <Text style={[e.textoOpcion, props.elegida && { color: '#FFFFFF' }]}>{props.etiqueta}</Text>
    </Pressable>
  );
}

export function Opciones<T>(props: {
  opciones: { valor: T; etiqueta: string }[]; valor: T; alCambiar: (v: T) => void;
}) {
  return (
    <View style={e.fila}>
      {props.opciones.map(o => (
        <Opcion key={String(o.valor)} etiqueta={o.etiqueta} elegida={o.valor === props.valor}
          alElegir={() => props.alCambiar(o.valor)} />
      ))}
    </View>
  );
}

export function Campo(props: { etiqueta: string; errores?: string[]; children: React.ReactNode; ayuda?: string }) {
  return (
    <View style={e.campo}>
      <Text style={e.etiqueta}>{props.etiqueta}</Text>
      {props.ayuda ? <Text style={e.ayuda}>{props.ayuda}</Text> : null}
      {props.children}
      {props.errores?.map(m => <Text key={m} style={e.error} accessibilityLiveRegion="polite">⚠ {m}</Text>)}
    </View>
  );
}

export function Entrada(props: TextInputProps & { conError?: boolean }) {
  const { conError, style, ...resto } = props;
  return (
    <TextInput
      placeholderTextColor={C.suave}
      {...resto}
      style={[e.entrada, props.multiline && e.multilinea, conError && { borderColor: C.error }, style]}
    />
  );
}

export function Aviso(props: { texto: string; tipo?: 'ok' | 'error' | 'info' }) {
  const t = props.tipo ?? 'info';
  const fondo = t === 'ok' ? C.primarioSuave : t === 'error' ? C.errorSuave : C.avisoSuave;
  return <Text style={[e.aviso, { backgroundColor: fondo }]} accessibilityLiveRegion="polite">{props.texto}</Text>;
}

export const e = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: C.fondo },
  contenido: { padding: 16, gap: 12, paddingBottom: 48 },
  encabezado: { padding: 16, borderBottomWidth: 2, borderColor: C.borde, gap: 4 },
  filaEncabezado: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  titulo: { fontSize: 24, fontWeight: '700', color: C.texto, flexShrink: 1 },
  subtitulo: { fontSize: 20, fontWeight: '700', color: C.texto, marginTop: 8 },
  version: { fontSize: 15, color: C.suave },
  cuerpo: { fontSize: 18, lineHeight: 26, color: C.texto },
  pequeno: { fontSize: 15, color: C.suave },
  boton: { minHeight: 56, borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center' },
  botonSecundario: { backgroundColor: C.fondo, borderWidth: 2, borderColor: C.borde },
  textoBoton: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  fila: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opcion: { minHeight: 48, paddingHorizontal: 14, borderRadius: 24, borderWidth: 2, borderColor: C.borde, justifyContent: 'center' },
  opcionElegida: { backgroundColor: C.primario, borderColor: C.primario },
  textoOpcion: { fontSize: 16, color: C.texto },
  campo: { gap: 6 },
  etiqueta: { fontSize: 18, fontWeight: '700', color: C.texto },
  ayuda: { fontSize: 15, color: C.suave },
  entrada: { minHeight: 56, borderWidth: 2, borderColor: C.borde, borderRadius: 12, paddingHorizontal: 12, fontSize: 18, color: C.texto, backgroundColor: C.fondo },
  multilinea: { minHeight: 160, paddingTop: 12, textAlignVertical: 'top' },
  error: { fontSize: 16, color: C.error, fontWeight: '700' },
  aviso: { fontSize: 17, color: C.texto, padding: 12, borderRadius: 12 },
  tarjeta: { borderWidth: 2, borderColor: C.borde, borderRadius: 12, padding: 12, gap: 6, backgroundColor: C.fondo },
});
