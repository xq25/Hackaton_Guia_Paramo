import { StyleSheet, Text, View } from 'react-native';
import { Boton, Etiqueta, Hoja } from '../comunes';
import { colores, espacio, tamanos, tipografia } from '../tema';

export interface HojaSeguridadProps {
  visible: boolean;
  alCerrar: () => void;
}

/**
 * Pantalla de Seguridad: siempre accesible desde el mapa y desde el menú,
 * nunca bloqueada por el juego ni por la geocerca (regla no negociable 5).
 */
export function HojaSeguridad({ visible, alCerrar }: HojaSeguridadProps) {
  return (
    <Hoja visible={visible} alCerrar={alCerrar} titulo="🆘 Seguridad en el recorrido" altoMaximo={0.85}>
      <View style={estilos.alertaPrincipal}>
        <Etiqueta texto="Atención prioritaria" variante="seguridad" />
        <Text style={estilos.mensajePrincipal}>
          Avisa a tu guía o al personal del parque.
        </Text>
        <Text style={estilos.detalle}>
          Ante cualquier síntoma de malestar por la altura, extravío, cambio brusco de clima o situación de riesgo, detén la marcha en un punto seguro del sendero demarcado y comunícate de inmediato con tu guía acompañante o con los guardaparques de UTON / PNN Los Nevados.
        </Text>
      </View>

      <View style={estilos.bloqueNormas}>
        <Text style={estilos.subtitulo}>Recuerda durante la caminata</Text>
        <Text style={estilos.item}>• Permanece siempre sobre el sendero autorizado junto a tu grupo.</Text>
        <Text style={estilos.item}>• Esta aplicación es informativa y funciona sin señal: no envía alertas ni ubicación.</Text>
        <Text style={estilos.item}>• No tomes decisiones médicas con base en la app; acude siempre al personal.</Text>
      </View>

      <Boton titulo="Entendido" variante="secundario" alPresionar={alCerrar} />
    </Hoja>
  );
}

const estilos = StyleSheet.create({
  alertaPrincipal: {
    backgroundColor: colores.seguridadSuave,
    borderWidth: tamanos.bordeGrueso,
    borderColor: colores.seguridad,
    borderRadius: tamanos.radio,
    padding: espacio.m,
    gap: espacio.s,
  },
  mensajePrincipal: {
    fontSize: tipografia.titulo,
    fontWeight: tipografia.pesoFuerte,
    color: colores.seguridad,
  },
  detalle: {
    fontSize: tipografia.cuerpo,
    lineHeight: tipografia.interlineado,
    color: colores.texto,
  },
  bloqueNormas: {
    backgroundColor: colores.superficie,
    borderRadius: tamanos.radio,
    padding: espacio.m,
    gap: espacio.s,
  },
  subtitulo: {
    fontSize: tipografia.subtitulo,
    fontWeight: tipografia.pesoFuerte,
    color: colores.texto,
  },
  item: {
    fontSize: tipografia.cuerpo,
    lineHeight: tipografia.interlineado,
    color: colores.texto,
  },
});
