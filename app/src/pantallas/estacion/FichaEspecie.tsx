import { Image, Linking, Pressable, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { CategoriaAmenaza, type Fragmento, type Guion } from '../../dominio/modelo';
import { Etiqueta, Hoja } from '../comunes';
import { colores, espacio, tamanos, tipografia } from '../tema';
import {
  buscarCaracteristicasEspecie,
  describirAmenazaUicn,
  type EspecieVista,
} from './especiesEstacion';

export type ResolvedorImagen = (ruta: string) => ImageSourcePropType | undefined;

export interface FichaEspecieProps {
  especie: EspecieVista | null;
  alCerrar: () => void;
  fragmentos: Fragmento[];
  guiones: Guion[];
  resolverImagen?: ResolvedorImagen;
}

export function FichaEspecie({
  especie,
  alCerrar,
  fragmentos,
  guiones,
  resolverImagen,
}: FichaEspecieProps) {
  if (!especie) return null;

  const fuenteImg = especie.rutaImagen && resolverImagen ? resolverImagen(especie.rutaImagen) : undefined;
  const textoUicn = describirAmenazaUicn(especie.categoriaAmenaza);
  const caracteristicas = buscarCaracteristicasEspecie(especie, fragmentos, guiones);
  const tituloFicha = especie.nombreComun ?? especie.nombreCientifico ?? 'Especie';

  const varianteUicn =
    especie.categoriaAmenaza === CategoriaAmenaza.CR || especie.categoriaAmenaza === CategoriaAmenaza.EN
      ? 'seguridad'
      : especie.categoriaAmenaza === CategoriaAmenaza.VU
      ? 'acento'
      : 'info';

  return (
    <Hoja visible={Boolean(especie)} alCerrar={alCerrar} titulo={tituloFicha} altoMaximo={0.88}>
      {/* Imagen grande */}
      {fuenteImg ? (
        <Image source={fuenteImg} style={estilos.imagen} resizeMode="cover" accessibilityLabel={tituloFicha} />
      ) : (
        <View style={estilos.imagenRespaldo}>
          <Text style={estilos.iconoRespaldo}>🌿</Text>
          <Text style={estilos.textoRespaldo}>Fotografía aún no empaquetada</Text>
        </View>
      )}

      {/* Nombres común y científico */}
      <View style={estilos.bloqueNombres}>
        <Text style={estilos.nombreComun}>
          {especie.nombreComun ?? 'Nombre común no registrado'}
        </Text>
        {especie.nombreCientifico ? (
          <Text style={estilos.nombreCientifico}>{especie.nombreCientifico}</Text>
        ) : null}
      </View>

      {/* Categoría UICN (Fuente: GBIF) y regla OCULTAR_UBICACION (CR/EN/VU) */}
      <View style={estilos.filaEtiquetas}>
        {textoUicn ? (
          <Etiqueta texto={`UICN: ${textoUicn}`} variante={varianteUicn} />
        ) : (
          <Etiqueta texto="Categoría UICN no evaluada · Fuente: GBIF" variante="neutra" />
        )}
        {especie.ocultarUbicacion ? (
          <Etiqueta texto="Ubicación reservada por conservación" variante="aviso" />
        ) : null}
      </View>

      {/* Características tomadas del guion oficial con su cita */}
      <View style={estilos.seccion}>
        <Text style={estilos.subtitulo}>Características en el guion</Text>
        {caracteristicas.length > 0 ? (
          caracteristicas.map(({ fragmento, citaTexto }) => (
            <View key={fragmento.id} style={estilos.tarjetaGuion}>
              <Text style={estilos.cuerpo}>{fragmento.texto}</Text>
              <Text style={estilos.cita}>📖 {citaTexto}</Text>
            </View>
          ))
        ) : (
          <Text style={estilos.textoSecundario}>
            Especie del catálogo complementario (GBIF). El guion interpretativo no incluye descripción detallada.
          </Text>
        )}
      </View>

      {/* Crédito obligatorio de la foto (CC0 / CC BY / CC BY-NC) */}
      <View style={estilos.bloqueCredito}>
        <Text style={estilos.subtituloCredito}>Crédito de la imagen</Text>
        {especie.credito ? (
          <>
            <Text style={estilos.textoCredito}>
              Autor: {especie.credito.autor} · Licencia {especie.credito.licencia} · Fuente:{' '}
              {especie.credito.fuente}
            </Text>
            {especie.credito.enlace ? (
              <Pressable
                accessibilityRole="link"
                onPress={() => Linking.openURL(especie.credito!.enlace).catch(() => undefined)}
              >
                <Text style={estilos.enlace} numberOfLines={1}>
                  {especie.credito.enlace}
                </Text>
              </Pressable>
            ) : null}
          </>
        ) : (
          <Text style={estilos.textoCredito}>Ilustración propia del equipo / sin foto externa.</Text>
        )}
      </View>
    </Hoja>
  );
}

const estilos = StyleSheet.create({
  imagen: {
    width: '100%',
    height: 220,
    borderRadius: tamanos.radio,
    backgroundColor: colores.superficie,
  },
  imagenRespaldo: {
    width: '100%',
    height: 180,
    borderRadius: tamanos.radio,
    borderWidth: tamanos.bordeGrueso,
    borderColor: colores.borde,
    backgroundColor: colores.superficie,
    alignItems: 'center',
    justifyContent: 'center',
    gap: espacio.xs,
  },
  iconoRespaldo: { fontSize: 42 },
  textoRespaldo: { fontSize: tipografia.pequeno, color: colores.textoSuave },
  bloqueNombres: { gap: espacio.xs },
  nombreComun: {
    fontSize: tipografia.titulo,
    fontWeight: tipografia.pesoFuerte,
    color: colores.texto,
  },
  nombreCientifico: {
    fontSize: tipografia.cuerpo,
    fontStyle: 'italic',
    color: colores.textoSuave,
  },
  filaEtiquetas: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.s },
  seccion: { gap: espacio.s },
  subtitulo: {
    fontSize: tipografia.subtitulo,
    fontWeight: tipografia.pesoFuerte,
    color: colores.texto,
  },
  tarjetaGuion: {
    backgroundColor: colores.superficie,
    borderRadius: tamanos.radio,
    borderWidth: 1,
    borderColor: colores.borde,
    padding: espacio.m,
    gap: espacio.s,
  },
  cuerpo: {
    fontSize: tipografia.cuerpo,
    lineHeight: tipografia.interlineado,
    color: colores.texto,
  },
  cita: {
    fontSize: tipografia.pequeno,
    fontWeight: tipografia.pesoFuerte,
    color: colores.textoSuave,
  },
  textoSecundario: {
    fontSize: tipografia.cuerpo,
    lineHeight: tipografia.interlineado,
    color: colores.textoSuave,
  },
  bloqueCredito: {
    borderTopWidth: 1,
    borderTopColor: colores.bloqueada,
    paddingTop: espacio.s,
    gap: espacio.xs,
  },
  subtituloCredito: {
    fontSize: tipografia.pequeno,
    fontWeight: tipografia.pesoFuerte,
    color: colores.texto,
  },
  textoCredito: { fontSize: tipografia.pequeno, color: colores.textoSuave },
  enlace: {
    fontSize: tipografia.pequeno,
    color: colores.aviso,
    textDecorationLine: 'underline',
  },
});
