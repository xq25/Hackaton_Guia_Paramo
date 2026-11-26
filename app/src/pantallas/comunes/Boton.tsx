import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { colores, espacio, tamanos, tipografia } from '../tema';

export type VarianteBoton = 'primario' | 'secundario' | 'aviso' | 'seguridad';

export interface BotonProps {
  titulo: string;
  alPresionar: () => void;
  variante?: VarianteBoton;
  deshabilitado?: boolean;
  cargando?: boolean;
  /** Emoji o símbolo corto antes del texto (p. ej. '💬'). */
  icono?: string;
  estilo?: StyleProp<ViewStyle>;
}

const FONDO: Record<VarianteBoton, string> = {
  primario: colores.primario,
  secundario: colores.fondo,
  aviso: colores.aviso,
  seguridad: colores.seguridad,
};

/** Botón grande y de alto contraste. */
export function Boton({ titulo, alPresionar, variante = 'primario', deshabilitado, cargando, icono, estilo }: BotonProps) {
  const esSecundario = variante === 'secundario';
  const colorTexto = esSecundario ? colores.texto : colores.textoInverso;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityState={{ disabled: !!deshabilitado, busy: !!cargando }}
      onPress={alPresionar}
      disabled={deshabilitado || cargando}
      style={({ pressed }) => [
        estilos.base,
        { backgroundColor: FONDO[variante] },
        esSecundario && estilos.secundario,
        (deshabilitado || cargando) && estilos.deshabilitado,
        pressed && estilos.presionado,
        estilo,
      ]}
    >
      {cargando ? (
        <ActivityIndicator color={colorTexto} />
      ) : (
        <Text style={[estilos.texto, { color: colorTexto }]} numberOfLines={2}>
          {icono ? `${icono}  ` : ''}
          {titulo}
        </Text>
      )}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  base: {
    minHeight: tamanos.botonAlto,
    paddingHorizontal: espacio.l,
    paddingVertical: espacio.s,
    borderRadius: tamanos.radio,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secundario: { borderWidth: tamanos.bordeGrueso, borderColor: colores.borde },
  deshabilitado: { opacity: 0.5 },
  presionado: { opacity: 0.8 },
  texto: { fontSize: tipografia.cuerpo, fontWeight: tipografia.pesoFuerte, textAlign: 'center' },
});
