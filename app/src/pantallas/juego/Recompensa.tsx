import React, { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ResultadoVisita } from '../../juego';
import { COLORES, NIVEL_COLOR } from './estilos';

export interface PropsRecompensa {
  resultado: ResultadoVisita;   // Lo que devuelve progreso.registrarVisita()
  alCerrar: () => void;
}

/** Ventana de "¡Llegaste!" con lo desbloqueado. Si la visita no es nueva (mismo día), lo dice. */
export function Recompensa({ resultado, alCerrar }: PropsRecompensa) {
  const escala = useRef(new Animated.Value(0.6)).current;
  useEffect(() => {
    Animated.spring(escala, { toValue: 1, friction: 5, useNativeDriver: true }).start();
  }, [escala]);

  const nada = resultado.insignias.length === 0 && resultado.coleccionables.length === 0;

  return (
    <Modal transparent animationType="fade" visible onRequestClose={alCerrar}>
      <View style={s.fondo}>
        <Animated.View style={[s.caja, { transform: [{ scale: escala }] }]}>
          <Text style={s.titulo}>{resultado.nueva ? '¡Llegaste!' : 'Ya registraste esta estación hoy'}</Text>
          {resultado.nueva && nada && <Text style={s.texto}>Sigue visitando estaciones para ganar insignias.</Text>}
          {resultado.insignias.map(i => (
            <View key={i.id} style={s.fila}>
              <View style={[s.punto, { backgroundColor: NIVEL_COLOR[i.nivel] }]} />
              <Text style={s.texto}>Insignia: <Text style={s.negrita}>{i.nombre}</Text></Text>
            </View>
          ))}
          {resultado.coleccionables.map(c => (
            <View key={c.id} style={s.fila}>
              <View style={[s.punto, { backgroundColor: COLORES.acento }]} />
              <Text style={s.texto}>Nueva carta: <Text style={s.negrita}>{c.nombre}</Text></Text>
            </View>
          ))}
          <Pressable onPress={alCerrar} accessibilityRole="button" style={s.boton}>
            <Text style={s.botonTexto}>¡Genial!</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  caja: { width: '100%', maxWidth: 420, backgroundColor: COLORES.fondo, borderRadius: 24, padding: 24 },
  titulo: { fontSize: 26, fontWeight: '700', color: COLORES.texto, marginBottom: 12, textAlign: 'center' },
  fila: { flexDirection: 'row', alignItems: 'center', marginVertical: 6 },
  punto: { width: 18, height: 18, borderRadius: 9, marginRight: 10 },
  texto: { fontSize: 17, color: COLORES.texto, flexShrink: 1 },
  negrita: { fontWeight: '700' },
  boton: { marginTop: 20, paddingVertical: 14, borderRadius: 24, backgroundColor: COLORES.acento, alignItems: 'center' },
  botonTexto: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
