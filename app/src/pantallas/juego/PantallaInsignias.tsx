import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Insignia, ProgresoLocal } from '../../dominio/modelo';
import type { ProgresoJuego } from '../../juego';
import { COLORES, NIVEL_COLOR } from './estilos';

export interface PropsPantallaInsignias {
  progreso: ProgresoJuego;
  alCerrar: () => void;
}

export function PantallaInsignias({ progreso, alCerrar }: PropsPantallaInsignias) {
  const [estado, setEstado] = useState<ProgresoLocal | null>(null);
  useEffect(() => { progreso.cargar().then(setEstado); }, [progreso]);

  const ganadas = new Set(estado?.insigniasIds ?? []);
  const insignias = progreso.insignias();
  const porEstacion = progreso.paquete.estaciones.map(e => ({
    estacion: e,
    niveles: insignias.filter(i => i.criterio.tipo === 'visitas_estacion' && i.criterio.estacionId === e.id),
  }));
  const especiales = insignias.filter(i => i.criterio.tipo !== 'visitas_estacion');

  return (
    <View style={s.pantalla}>
      <View style={s.barra}>
        <Text style={s.titulo}>Insignias</Text>
        <Pressable onPress={alCerrar} accessibilityRole="button" style={s.cerrar}><Text style={s.cerrarTexto}>Cerrar</Text></Pressable>
      </View>
      <ScrollView contentContainerStyle={s.contenido}>
        <Text style={s.resumen}>{ganadas.size} de {insignias.length} insignias</Text>
        {porEstacion.map(({ estacion, niveles }) => (
          <View key={estacion.id} style={s.fila}>
            <Text style={s.estacion}>{estacion.nombre}</Text>
            <View style={s.medallas}>
              {niveles.map(i => <Medalla key={i.id} insignia={i} ganada={ganadas.has(i.id)} />)}
            </View>
          </View>
        ))}
        <Text style={s.seccion}>Especiales</Text>
        {especiales.map(i => (
          <View key={i.id} style={s.especial}>
            <Medalla insignia={i} ganada={ganadas.has(i.id)} />
            <View style={s.especialTexto}>
              <Text style={s.nombre}>{i.nombre}</Text>
              <Text style={s.descripcion}>{i.descripcion}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function Medalla({ insignia, ganada }: { insignia: Insignia; ganada: boolean }) {
  const color = ganada ? NIVEL_COLOR[insignia.nivel] : COLORES.bloqueado;
  return (
    <View style={s.medalla} accessibilityLabel={`${insignia.nombre}: ${ganada ? 'ganada' : 'por ganar'}. ${insignia.descripcion}`}>
      <View style={[s.circulo, { backgroundColor: color }]}>
        <Text style={s.circuloTexto}>{ganada ? '★' : '?'}</Text>
      </View>
      <Text style={s.medallaTexto} numberOfLines={2}>{['Bronce', 'Plata', 'Oro'][insignia.nivel - 1]}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: COLORES.fondo },
  barra: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  titulo: { fontSize: 26, fontWeight: '700', color: COLORES.texto },
  cerrar: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 24, backgroundColor: COLORES.acento },
  cerrarTexto: { color: '#fff', fontSize: 16, fontWeight: '600' },
  contenido: { paddingHorizontal: 16, paddingBottom: 32 },
  resumen: { fontSize: 16, color: COLORES.textoSuave, marginBottom: 12 },
  fila: { backgroundColor: COLORES.tarjeta, borderRadius: 16, padding: 14, marginBottom: 10 },
  estacion: { fontSize: 18, fontWeight: '600', color: COLORES.texto, marginBottom: 8 },
  medallas: { flexDirection: 'row', gap: 16 },
  medalla: { alignItems: 'center', width: 72 },
  circulo: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  circuloTexto: { fontSize: 26, color: '#fff', fontWeight: '700' },
  medallaTexto: { fontSize: 14, color: COLORES.textoSuave, marginTop: 4 },
  seccion: { fontSize: 20, fontWeight: '700', color: COLORES.texto, marginTop: 16, marginBottom: 8 },
  especial: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORES.tarjeta, borderRadius: 16, padding: 14, marginBottom: 10 },
  especialTexto: { flex: 1, marginLeft: 8 },
  nombre: { fontSize: 18, fontWeight: '600', color: COLORES.texto },
  descripcion: { fontSize: 15, color: COLORES.textoSuave },
});
