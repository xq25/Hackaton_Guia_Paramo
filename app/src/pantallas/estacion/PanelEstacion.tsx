import { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Naturaleza,
  type Coleccionable,
  type EspecieCatalogo,
  type Estacion,
  type Fragmento,
  type Guion,
} from '../../dominio/modelo';
import { Boton, Etiqueta, Hoja } from '../comunes';
import { colores, espacio, tamanos, tipografia } from '../tema';
import {
  FichaEspecie,
  resolverImagenEmpaquetada,
  type ResolvedorImagen,
} from './FichaEspecie';
import {
  construirEspeciesEstacion,
  formatearCitaFragmento,
  type EspecieVista,
} from './especiesEstacion';

export interface PanelEstacionProps {
  estacion: Estacion | null;
  alCerrar: () => void;
  fragmentos: Fragmento[];
  guiones: Guion[];
  catalogo: EspecieCatalogo[];
  cartasEspecie?: Coleccionable[];
  estacionVisitada?: boolean;
  /** Permite consultar ProgresoJuego.especieDesbloqueada(progresoLocal, nombreCientifico). */
  especieDesbloqueada?: (nombreCientifico: string | null) => boolean;
  modoDemoActivo?: boolean;
  alRegistrarLlegadaDemo?: (estacionId: string) => void;
  alPreguntarAlGuia: (estacionId: string) => void;
  resolverImagen?: ResolvedorImagen;
}

export function PanelEstacion({
  estacion,
  alCerrar,
  fragmentos,
  guiones,
  catalogo,
  cartasEspecie,
  estacionVisitada = false,
  especieDesbloqueada,
  modoDemoActivo = false,
  alRegistrarLlegadaDemo,
  alPreguntarAlGuia,
  resolverImagen = resolverImagenEmpaquetada,
}: PanelEstacionProps) {
  const [especieActiva, setEspecieActiva] = useState<EspecieVista | null>(null);

  const datosCuriosos = useMemo(() => {
    if (!estacion) return [];
    const porId = new Map(fragmentos.map((f) => [f.id, f]));
    return estacion.datosCuriososIds
      .map((id) => porId.get(id))
      .filter((f): f is Fragmento => Boolean(f && f.apto));
  }, [estacion, fragmentos]);

  const especies = useMemo(() => {
    if (!estacion) return [];
    return construirEspeciesEstacion(estacion, catalogo, cartasEspecie);
  }, [estacion, catalogo, cartasEspecie]);

  if (!estacion) return null;

  const imgEstacion = resolverImagen(estacion.imagen);
  const textoAltitud =
    estacion.altitudMsnm !== null
      ? `${estacion.altitudMsnm} m s. n. m.`
      : 'Altitud no registrada en guion';

  const estaEspecieDesbloqueada = (esp: EspecieVista): boolean => {
    if (especieDesbloqueada) return especieDesbloqueada(esp.nombreCientifico);
    return estacionVisitada;
  };

  return (
    <>
      <Hoja visible={Boolean(estacion)} alCerrar={alCerrar} titulo={estacion.nombre} altoMaximo={0.88}>
        {/* 1. Imagen de la estación */}
        {imgEstacion ? (
          <Image
            source={imgEstacion}
            style={estilos.imagenEstacion}
            resizeMode="cover"
            accessibilityLabel={`Estación ${estacion.nombre}`}
          />
        ) : (
          <View style={estilos.imagenRespaldo}>
            <Text style={estilos.iconoEstacion}>🏔️</Text>
            <Text style={estilos.ecosistemaRespaldo}>{estacion.ecosistema}</Text>
          </View>
        )}

        {/* 2. Altitud, ecosistema y concepto central */}
        <View style={estilos.filaEtiquetas}>
          <Etiqueta texto={textoAltitud} variante="info" />
          <Etiqueta texto={estacion.ecosistema} variante="neutra" />
          <Etiqueta
            texto={estacionVisitada ? 'Estación visitada' : 'Pendiente de visita'}
            variante={estacionVisitada ? 'info' : 'neutra'}
          />
        </View>

        <View style={estilos.bloqueConcepto}>
          <Text style={estilos.etiquetaCampo}>Concepto central</Text>
          <Text style={estilos.concepto}>{estacion.conceptoCentral}</Text>
        </View>

        {/* Botón de llegada en modo demo (C6) */}
        {modoDemoActivo && alRegistrarLlegadaDemo ? (
          <Boton
            titulo="Registrar llegada (demo)"
            icono="📍"
            variante="aviso"
            alPresionar={() => alRegistrarLlegadaDemo(estacion.id)}
          />
        ) : null}

        {/* 3. Datos curiosos con cita */}
        {datosCuriosos.length > 0 ? (
          <View style={estilos.bloqueDatoCurioso}>
            <Text style={estilos.subtitulo}>Dato curioso</Text>
            {datosCuriosos.slice(0, 3).map((dc) => (
              <View key={dc.id} style={estilos.tarjetaCuriosa}>
                {dc.naturaleza === Naturaleza.TRADICION_ORAL ? (
                  <Etiqueta texto="Relato de tradición oral" variante="acento" />
                ) : null}
                <Text style={estilos.cuerpo}>{dc.texto}</Text>
                <Text style={estilos.cita}>
                  📖 {formatearCitaFragmento(dc, guiones, estacion.nombre)}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* 4. Cuadrícula de fauna y flora 3 × n */}
        <View style={estilos.bloqueEspecies}>
          <Text style={estilos.subtitulo}>Fauna y flora de la estación</Text>
          {!estacionVisitada ? (
            <Text style={estilos.avisoBloqueo}>
              Llega a la estación para descubrir su fauna y flora.
            </Text>
          ) : null}

          {especies.length > 0 ? (
            <View style={estilos.cuadricula}>
              {especies.map((esp) => {
                const desbloqueada = estaEspecieDesbloqueada(esp);
                const mini =
                  desbloqueada && esp.rutaMiniatura
                    ? resolverImagen(esp.rutaMiniatura)
                    : undefined;
                const etiquetaNombre = esp.nombreComun ?? esp.nombreCientifico ?? 'Especie';
                return (
                  <Pressable
                    key={esp.clave}
                    accessibilityRole="button"
                    accessibilityLabel={
                      desbloqueada
                        ? `Ver ficha de ${etiquetaNombre}`
                        : 'Llega a la estación para descubrirla'
                    }
                    disabled={!desbloqueada}
                    onPress={() => setEspecieActiva(esp)}
                    style={({ pressed }) => [
                      estilos.celdaEspecie,
                      !desbloqueada && estilos.celdaBloqueada,
                      pressed && desbloqueada && estilos.presionado,
                    ]}
                  >
                    {desbloqueada ? (
                      <>
                        {mini ? (
                          <Image source={mini} style={estilos.miniImagen} resizeMode="cover" />
                        ) : (
                          <View style={estilos.miniRespaldo}>
                            <Text style={estilos.miniIcono}>🌱</Text>
                          </View>
                        )}
                        <Text style={estilos.nombreCelda} numberOfLines={2}>
                          {etiquetaNombre}
                        </Text>
                      </>
                    ) : (
                      <>
                        <View style={estilos.silueta}>
                          <Text style={estilos.siluetaTexto}>?</Text>
                        </View>
                        <Text style={estilos.nombreBloqueado} numberOfLines={2}>
                          Llega a la estación para descubrirla
                        </Text>
                      </>
                    )}
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <Text style={estilos.avisoBloqueo}>
              Esta estación introductoria no registra tabla específica de especies en el guion.
            </Text>
          )}
        </View>

        {/* 5. Preguntar al guía sobre esta estación */}
        <Boton
          titulo="Preguntar al guía sobre esta estación"
          icono="💬"
          alPresionar={() => alPreguntarAlGuia(estacion.id)}
        />
      </Hoja>

      <FichaEspecie
        especie={especieActiva}
        alCerrar={() => setEspecieActiva(null)}
        fragmentos={fragmentos}
        guiones={guiones}
        resolverImagen={resolverImagen}
      />
    </>
  );
}

const estilos = StyleSheet.create({
  imagenEstacion: {
    width: '100%',
    height: 180,
    borderRadius: tamanos.radio,
    backgroundColor: colores.superficie,
  },
  imagenRespaldo: {
    width: '100%',
    height: 140,
    borderRadius: tamanos.radio,
    borderWidth: tamanos.bordeGrueso,
    borderColor: colores.borde,
    backgroundColor: colores.primarioSuave,
    alignItems: 'center',
    justifyContent: 'center',
    gap: espacio.xs,
  },
  iconoEstacion: { fontSize: 38 },
  ecosistemaRespaldo: {
    fontSize: tipografia.pequeno,
    fontWeight: tipografia.pesoFuerte,
    color: colores.primario,
  },
  filaEtiquetas: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.s },
  bloqueConcepto: {
    backgroundColor: colores.superficie,
    borderRadius: tamanos.radio,
    padding: espacio.m,
    gap: espacio.xs,
  },
  etiquetaCampo: {
    fontSize: tipografia.pequeno,
    fontWeight: tipografia.pesoFuerte,
    color: colores.textoSuave,
  },
  concepto: {
    fontSize: tipografia.subtitulo,
    fontWeight: tipografia.pesoFuerte,
    color: colores.texto,
  },
  subtitulo: {
    fontSize: tipografia.subtitulo,
    fontWeight: tipografia.pesoFuerte,
    color: colores.texto,
  },
  bloqueDatoCurioso: { gap: espacio.s },
  tarjetaCuriosa: {
    backgroundColor: colores.acentoSuave,
    borderRadius: tamanos.radio,
    borderWidth: 1,
    borderColor: colores.acento,
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
  bloqueEspecies: { gap: espacio.s },
  avisoBloqueo: {
    fontSize: tipografia.pequeno,
    fontWeight: tipografia.pesoFuerte,
    color: colores.textoSuave,
  },
  cuadricula: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espacio.s,
  },
  celdaEspecie: {
    width: '31%',
    minHeight: 118,
    borderRadius: tamanos.radio,
    borderWidth: tamanos.bordeGrueso,
    borderColor: colores.borde,
    backgroundColor: colores.fondo,
    padding: espacio.xs + 2,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espacio.xs,
  },
  celdaBloqueada: {
    backgroundColor: colores.superficie,
    borderColor: colores.bloqueada,
  },
  presionado: { opacity: 0.8 },
  miniImagen: { width: '100%', height: 68, borderRadius: 8 },
  miniRespaldo: {
    width: '100%',
    height: 68,
    borderRadius: 8,
    backgroundColor: colores.primarioSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniIcono: { fontSize: 28 },
  nombreCelda: {
    fontSize: tipografia.pequeno,
    fontWeight: tipografia.pesoFuerte,
    color: colores.texto,
    textAlign: 'center',
  },
  silueta: {
    width: '100%',
    height: 68,
    borderRadius: 8,
    backgroundColor: colores.bloqueada,
    alignItems: 'center',
    justifyContent: 'center',
  },
  siluetaTexto: {
    fontSize: tipografia.titulo,
    fontWeight: tipografia.pesoFuerte,
    color: colores.fondo,
  },
  nombreBloqueado: {
    fontSize: 12,
    color: colores.textoSuave,
    textAlign: 'center',
  },
});
