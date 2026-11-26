import React, { useEffect, useState } from 'react';
import { FlatList, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TipoColeccionable, type Coleccionable, type EspecieCatalogo, type ProgresoLocal } from '../../dominio/modelo';
import type { ProgresoJuego } from '../../juego';
import { COLORES, imagenDe } from './estilos';

export interface PropsPantallaAlbum {
  progreso: ProgresoJuego;
  catalogo: EspecieCatalogo[];
  alCerrar: () => void;
}

const NOMBRE_AMENAZA: Record<string, string> = {
  CR: 'En peligro crítico', EN: 'En peligro', VU: 'Vulnerable', NT: 'Casi amenazada', LC: 'Preocupación menor', NE: 'No evaluada',
};

export function PantallaAlbum({ progreso, catalogo, alCerrar }: PropsPantallaAlbum) {
  const [estado, setEstado] = useState<ProgresoLocal | null>(null);
  const [abierta, setAbierta] = useState<Coleccionable | null>(null);
  useEffect(() => { progreso.cargar().then(setEstado); }, [progreso]);

  const cartas = progreso.coleccionables();
  const tiene = (c: Coleccionable) => estado?.coleccionablesIds.includes(c.id) ?? false;

  return (
    <View style={s.pantalla}>
      <View style={s.barra}>
        <Text style={s.titulo}>Álbum</Text>
        <Pressable onPress={alCerrar} accessibilityRole="button" style={s.boton}><Text style={s.botonTexto}>Cerrar</Text></Pressable>
      </View>
      <Text style={s.resumen}>{cartas.filter(tiene).length} de {cartas.length} cartas</Text>
      <FlatList
        data={cartas}
        keyExtractor={c => c.id}
        numColumns={3}
        contentContainerStyle={s.rejilla}
        renderItem={({ item }) => (
          <Pressable
            style={s.celda}
            onPress={() => tiene(item) && setAbierta(item)}
            accessibilityRole="button"
            accessibilityLabel={tiene(item) ? item.nombre : 'Carta bloqueada'}
          >
            <Miniatura carta={item} desbloqueada={tiene(item)} />
            <Text style={s.celdaTexto} numberOfLines={2}>{tiene(item) ? item.nombre : '???'}</Text>
          </Pressable>
        )}
      />
      <Modal visible={abierta !== null} animationType="slide" onRequestClose={() => setAbierta(null)}>
        {abierta && <Carta carta={abierta} progreso={progreso} catalogo={catalogo} alCerrar={() => setAbierta(null)} />}
      </Modal>
    </View>
  );
}

function Miniatura({ carta, desbloqueada }: { carta: Coleccionable; desbloqueada: boolean }) {
  const fuente = imagenDe(carta.imagenMini) ?? imagenDe(carta.imagen);
  if (desbloqueada && fuente) return <Image source={fuente} style={s.mini} />;
  return (
    <View style={[s.mini, s.miniVacia, !desbloqueada && s.silueta]}>
      <Text style={s.miniTexto}>{desbloqueada ? carta.nombre.charAt(0) : '?'}</Text>
    </View>
  );
}

function Carta({ carta, progreso, catalogo, alCerrar }: { carta: Coleccionable; progreso: ProgresoJuego; catalogo: EspecieCatalogo[]; alCerrar: () => void }) {
  const especie = carta.nombreCientifico ? catalogo.find(e => e.nombreCientifico === carta.nombreCientifico) : undefined;
  const fragmentos = progreso.fragmentosDeCarta(carta);
  const amenaza = carta.categoriaAmenaza ?? especie?.categoriaAmenaza ?? null;
  const credito = carta.credito ?? especie?.credito ?? null;
  const fuente = imagenDe(carta.imagen) ?? imagenDe(especie?.foto);
  const guion = (id: string) => progreso.paquete.guiones.find(g => g.id === id)?.titulo ?? id;

  return (
    <ScrollView style={s.pantalla} contentContainerStyle={s.carta}>
      {fuente ? <Image source={fuente} style={s.imagen} /> : <View style={[s.imagen, s.miniVacia]}><Text style={s.miniTexto}>{carta.nombre.charAt(0)}</Text></View>}
      <Text style={s.cartaNombre}>{carta.nombre}</Text>
      {carta.nombreCientifico && <Text style={s.cientifico}>{carta.nombreCientifico}</Text>}
      {carta.tipo === TipoColeccionable.ESPECIE && amenaza && (
        <Text style={[s.etiqueta, ['CR', 'EN', 'VU'].includes(amenaza) && s.amenazada]}>
          {NOMBRE_AMENAZA[amenaza]} · Fuente: GBIF
        </Text>
      )}
      {fragmentos.slice(0, 2).map(f => (
        <View key={f.id} style={s.bloque}>
          <Text style={s.texto}>{f.texto}</Text>
          <Text style={s.cita}>{guion(f.guionId)} · p. {f.pagina}</Text>
        </View>
      ))}
      {credito && (
        <Text style={s.credito}>Foto: {credito.autor} · {credito.licencia} · {credito.fuente}</Text>
      )}
      <Pressable onPress={alCerrar} accessibilityRole="button" style={[s.boton, s.botonGrande]}>
        <Text style={s.botonTexto}>Volver al álbum</Text>
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: COLORES.fondo },
  barra: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  titulo: { fontSize: 26, fontWeight: '700', color: COLORES.texto },
  resumen: { fontSize: 16, color: COLORES.textoSuave, paddingHorizontal: 16, marginBottom: 8 },
  boton: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 24, backgroundColor: COLORES.acento, alignItems: 'center' },
  botonGrande: { marginTop: 24, paddingVertical: 14 },
  botonTexto: { color: '#fff', fontSize: 16, fontWeight: '600' },
  rejilla: { paddingHorizontal: 10, paddingBottom: 32 },
  celda: { flex: 1 / 3, alignItems: 'center', padding: 6 },
  celdaTexto: { fontSize: 14, color: COLORES.texto, textAlign: 'center', marginTop: 4 },
  mini: { width: 96, height: 96, borderRadius: 14 },
  miniVacia: { backgroundColor: COLORES.tarjeta, alignItems: 'center', justifyContent: 'center' },
  silueta: { backgroundColor: COLORES.bloqueado },
  miniTexto: { fontSize: 36, fontWeight: '700', color: COLORES.textoSuave },
  carta: { padding: 16, paddingBottom: 40 },
  imagen: { width: '100%', aspectRatio: 1, borderRadius: 18 },
  cartaNombre: { fontSize: 28, fontWeight: '700', color: COLORES.texto, marginTop: 12 },
  cientifico: { fontSize: 17, fontStyle: 'italic', color: COLORES.textoSuave },
  etiqueta: { alignSelf: 'flex-start', marginTop: 8, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, backgroundColor: COLORES.tarjeta, color: COLORES.texto, fontSize: 14 },
  amenazada: { backgroundColor: COLORES.amenaza, color: '#fff' },
  bloque: { backgroundColor: COLORES.tarjeta, borderRadius: 14, padding: 14, marginTop: 12 },
  texto: { fontSize: 17, lineHeight: 25, color: COLORES.texto },
  cita: { fontSize: 14, color: COLORES.acento, marginTop: 8, fontWeight: '600' },
  credito: { fontSize: 13, color: COLORES.textoSuave, marginTop: 12 },
});
