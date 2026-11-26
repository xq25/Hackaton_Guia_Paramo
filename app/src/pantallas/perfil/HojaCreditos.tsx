import { StyleSheet, Text, View } from 'react-native';
import { Boton, Hoja } from '../comunes';
import { colores, espacio, tamanos, tipografia } from '../tema';

export interface HojaCreditosProps {
  visible: boolean;
  alCerrar: () => void;
}

export function HojaCreditos({ visible, alCerrar }: HojaCreditosProps) {
  return (
    <Hoja visible={visible} alCerrar={alCerrar} titulo="Créditos y fuentes" altoMaximo={0.85}>
      <BloqueFuente
        titulo="Guiones oficiales del recorrido"
        cuerpo="Guion Ecoturístico UTON 2024 y Guion Zona Norte — Unión Temporal Operación Nevados (UTON) y Parque Nacional Natural Los Nevados. El guía virtual responde únicamente con estos documentos."
      />
      <BloqueFuente
        titulo="Catálogo de biodiversidad (GBIF)"
        cuerpo="Global Biodiversity Information Facility (GBIF.org): registros taxonómicos del sector norte del PNN Los Nevados y categorías de amenaza de la Lista Roja de la UICN."
      />
      <BloqueFuente
        titulo="Fotografías de flora y fauna (iNaturalist)"
        cuerpo="Observaciones comunitarias de iNaturalist bajo licencias abiertas CC0, CC BY y CC BY-NC. La autoría, licencia y enlace de cada fotografía se muestran en su ficha de especie."
      />
      <BloqueFuente
        titulo="Cartografía sin conexión"
        cuerpo="Datos cartográficos © colaboradores de OpenStreetMap (ODbL), empaquetados con Protomaps (PMTiles) y visualizados con Leaflet."
      />
      <Boton titulo="Cerrar" variante="secundario" alPresionar={alCerrar} />
    </Hoja>
  );
}

function BloqueFuente({ titulo, cuerpo }: { titulo: string; cuerpo: string }) {
  return (
    <View style={estilos.tarjeta}>
      <Text style={estilos.titulo}>{titulo}</Text>
      <Text style={estilos.cuerpo}>{cuerpo}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    backgroundColor: colores.superficie,
    borderRadius: tamanos.radio,
    borderWidth: 1,
    borderColor: colores.borde,
    padding: espacio.m,
    gap: espacio.xs,
  },
  titulo: {
    fontSize: tipografia.cuerpo,
    fontWeight: tipografia.pesoFuerte,
    color: colores.texto,
  },
  cuerpo: {
    fontSize: tipografia.pequeno,
    lineHeight: 22,
    color: colores.textoSuave,
  },
});
