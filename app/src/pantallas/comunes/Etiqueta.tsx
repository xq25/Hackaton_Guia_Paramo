import { StyleSheet, Text, View } from 'react-native';
import { colores, espacio, tipografia } from '../tema';

export type VarianteEtiqueta = 'info' | 'aviso' | 'acento' | 'seguridad' | 'neutra';

export interface EtiquetaProps {
  texto: string;
  variante?: VarianteEtiqueta;
}

const COLORES: Record<VarianteEtiqueta, { fondo: string; texto: string }> = {
  info: { fondo: colores.primarioSuave, texto: colores.primario },
  aviso: { fondo: colores.avisoSuave, texto: colores.aviso },
  acento: { fondo: colores.acentoSuave, texto: colores.acento },
  seguridad: { fondo: colores.seguridadSuave, texto: colores.seguridad },
  neutra: { fondo: colores.superficie, texto: colores.textoSuave },
};

/** Etiqueta corta: advertencias ("Tradición oral", "Dato de 2022"), UICN, estados. */
export function Etiqueta({ texto, variante = 'neutra' }: EtiquetaProps) {
  const c = COLORES[variante];
  return (
    <View style={[estilos.base, { backgroundColor: c.fondo, borderColor: c.texto }]}>
      <Text style={[estilos.texto, { color: c.texto }]}>{texto}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: espacio.s + 2,
    paddingVertical: espacio.xs,
  },
  texto: { fontSize: tipografia.pequeno, fontWeight: tipografia.pesoFuerte },
});
