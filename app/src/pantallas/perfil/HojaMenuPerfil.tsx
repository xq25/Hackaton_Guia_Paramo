import { StyleSheet, Text, View } from 'react-native';
import { Boton, Hoja } from '../comunes';
import { colores, espacio, tipografia } from '../tema';

export interface HojaMenuPerfilProps {
  visible: boolean;
  alCerrar: () => void;
  /** Se habilitan apenas se integran los módulos de A (S9) y B (S1). */
  alAbrirInsignias?: () => void;
  alAbrirAlbum?: () => void;
  alAbrirEditor?: () => void;
  alAbrirSeguridad: () => void;
  alAbrirCreditos: () => void;
  alAbrirAjustes: () => void;
}

export function HojaMenuPerfil({
  visible,
  alCerrar,
  alAbrirInsignias,
  alAbrirAlbum,
  alAbrirEditor,
  alAbrirSeguridad,
  alAbrirCreditos,
  alAbrirAjustes,
}: HojaMenuPerfilProps) {
  const abrirYCerrar = (accion?: () => void) => () => {
    if (!accion) return;
    alCerrar();
    accion();
  };

  return (
    <Hoja visible={visible} alCerrar={alCerrar} titulo="👤 Menú" altoMaximo={0.85}>
      <View style={estilos.grupo}>
        <Boton
          titulo="Insignias"
          icono="🏅"
          variante="primario"
          deshabilitado={!alAbrirInsignias}
          alPresionar={abrirYCerrar(alAbrirInsignias)}
        />
        <Boton
          titulo="Álbum de especies"
          icono="📘"
          variante="primario"
          deshabilitado={!alAbrirAlbum}
          alPresionar={abrirYCerrar(alAbrirAlbum)}
        />
        {!alAbrirInsignias || !alAbrirAlbum ? (
          <Text style={estilos.notaPendiente}>
            Insignias y álbum se habilitan al integrar el módulo de juego (S9).
          </Text>
        ) : null}
      </View>

      <View style={estilos.grupo}>
        <Boton
          titulo="Editar guion"
          icono="✏️"
          variante="secundario"
          deshabilitado={!alAbrirEditor}
          alPresionar={abrirYCerrar(alAbrirEditor)}
        />
        {!alAbrirEditor ? (
          <Text style={estilos.notaPendiente}>
            El editor de fichas se habilita al integrar el módulo del asistente (S1).
          </Text>
        ) : null}
      </View>

      <View style={estilos.grupo}>
        <Boton
          titulo="Seguridad"
          icono="🆘"
          variante="seguridad"
          alPresionar={abrirYCerrar(alAbrirSeguridad)}
        />
        <Boton
          titulo="Créditos"
          icono="📄"
          variante="secundario"
          alPresionar={abrirYCerrar(alAbrirCreditos)}
        />
        <Boton
          titulo="Ajustes"
          icono="⚙️"
          variante="secundario"
          alPresionar={abrirYCerrar(alAbrirAjustes)}
        />
      </View>
    </Hoja>
  );
}

const estilos = StyleSheet.create({
  grupo: { gap: espacio.s },
  notaPendiente: {
    fontSize: tipografia.pequeno,
    color: colores.textoSuave,
    paddingHorizontal: espacio.xs,
  },
});
