/**
 * Editor del guion (docs/05). Flujo:
 *   contraseña → lista (fichas guardadas + fragmentos del guion, buscar por texto y estación)
 *   → formulario (Guardar borrador / Publicar / Retirar) → "Probar una pregunta"
 *   → exportar / importar (texto JSON para copiar o pegar).
 * La versión del guion está siempre visible arriba. Todo offline.
 */
import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import {
  EstadoFicha,
  Nivel,
  type FichaContenido,
  type Fragmento,
  type Respuesta,
} from '../../dominio/modelo';
import type { Asistente } from '../../asistente';
import { Aviso, BotonEditor, Campo, Entrada, Opcion, Opciones, e } from './componentes';
import {
  ESTADOS,
  TEMAS,
  TIPOS,
  TIPOS_RESPUESTA,
  erroresPorCampo,
  fichaNueva,
  filtrarFragmentos,
  leerPagina,
  nombreArchivoExportacion,
} from './logica';

type Vista = 'clave' | 'lista' | 'formulario' | 'probar' | 'archivo';
type Mensaje = { texto: string; tipo: 'ok' | 'error' | 'info' } | null;

const MAX_RESULTADOS = 40;

export function PantallaEditor(props: { asistente: Asistente; alCerrar: () => void }): React.JSX.Element {
  const { asistente } = props;
  const [vista, setVista] = useState<Vista>('clave');
  const [ficha, setFicha] = useState<FichaContenido | null>(null);
  const [mensaje, setMensaje] = useState<Mensaje>(null);
  const [, setRevision] = useState(0); // fuerza a releer fichas y versión tras guardar
  const refrescar = () => setRevision(n => n + 1);

  const ir = (v: Vista, m: Mensaje = null) => { setMensaje(m); setVista(v); };

  return (
    <View style={e.pantalla}>
      <View style={e.encabezado}>
        <View style={e.filaEncabezado}>
          <Text style={e.titulo} accessibilityRole="header">Editor del guion</Text>
          <BotonEditor titulo="Cerrar" variante="secundario" alPresionar={props.alCerrar} />
        </View>
        <Text style={e.version}>Versión del guion: {asistente.versionGuion()}</Text>
      </View>

      <ScrollView contentContainerStyle={e.contenido} keyboardShouldPersistTaps="handled">
        {mensaje ? <Aviso texto={mensaje.texto} tipo={mensaje.tipo} /> : null}

        {vista === 'clave' && (
          <VistaClave alEntrar={clave => {
            if (asistente.fichas.desbloquear(clave)) ir('lista');
            else setMensaje({ texto: 'Contraseña incorrecta. Pídela a la coordinación de guías.', tipo: 'error' });
          }} />
        )}

        {vista === 'lista' && (
          <VistaLista
            asistente={asistente}
            alEditar={f => { setFicha(f); ir('formulario'); }}
            alProbar={() => ir('probar')}
            alArchivo={() => ir('archivo')}
          />
        )}

        {vista === 'formulario' && ficha && (
          <VistaFormulario
            asistente={asistente}
            inicial={ficha}
            alTerminar={m => { refrescar(); ir('lista', m); }}
            alProbar={m => { refrescar(); ir('probar', m); }}
            alVolver={() => ir('lista')}
          />
        )}

        {vista === 'probar' && <VistaProbar asistente={asistente} alVolver={() => ir('lista')} />}

        {vista === 'archivo' && (
          <VistaArchivo
            asistente={asistente}
            alImportar={m => { refrescar(); ir('lista', m); }}
            alVolver={() => ir('lista')}
          />
        )}
      </ScrollView>
    </View>
  );
}

// ───────────────────────── Contraseña ─────────────────────────

function VistaClave(props: { alEntrar: (clave: string) => void }) {
  const [clave, setClave] = useState('');
  return (
    <>
      <Text style={e.cuerpo}>
        Aquí el personal corrige o agrega lo que responde el guía virtual. Escribe la contraseña del editor.
      </Text>
      <Campo etiqueta="Contraseña">
        <Entrada value={clave} onChangeText={setClave} secureTextEntry autoCapitalize="none"
          autoCorrect={false} onSubmitEditing={() => props.alEntrar(clave)} accessibilityLabel="Contraseña" />
      </Campo>
      <BotonEditor titulo="Entrar" alPresionar={() => props.alEntrar(clave)} deshabilitado={!clave} />
    </>
  );
}

// ───────────────────────── Lista ─────────────────────────

function VistaLista(props: {
  asistente: Asistente;
  alEditar: (f: FichaContenido) => void;
  alProbar: () => void;
  alArchivo: () => void;
}) {
  const { editor } = props.asistente;
  const [busqueda, setBusqueda] = useState('');
  const [estacion, setEstacion] = useState<string | null | 'todas'>('todas');
  const estaciones = editor.estaciones();
  const guiones = editor.guiones();
  const fichas = editor.fichas();
  const nombreEstacion = (id: string | null) =>
    id ? estaciones.find(x => x.id === id)?.nombre ?? id : 'Todo el recorrido';
  const tituloGuion = (id: string) => guiones.find(g => g.id === id)?.titulo ?? id;

  const encontrados = useMemo(
    () => filtrarFragmentos(editor.fragmentosGuion(), busqueda, estacion),
    [editor, busqueda, estacion],
  );
  // ¿Qué ficha (no retirada) corrige cada fragmento?
  const fichaDe = (f: Fragmento) =>
    fichas.find(x => x.estado !== EstadoFicha.RETIRADA && x.reemplazaFragmentoIds.includes(f.id));

  return (
    <>
      <View style={e.fila}>
        <BotonEditor titulo="＋ Agregar ficha nueva" alPresionar={() => props.alEditar(fichaNueva())} />
        <BotonEditor titulo="Probar una pregunta" variante="secundario" alPresionar={props.alProbar} />
        <BotonEditor titulo="Exportar / importar" variante="secundario" alPresionar={props.alArchivo} />
      </View>

      <Text style={e.subtitulo}>Fichas guardadas ({fichas.length})</Text>
      {fichas.length === 0 && <Text style={e.pequeno}>Todavía no hay fichas.</Text>}
      {fichas.map(f => (
        <View key={f.id} style={e.tarjeta}>
          <Text style={e.etiqueta}>{f.titulo || 'Sin título'}</Text>
          <Text style={e.pequeno}>{ESTADOS[f.estado]} · {nombreEstacion(f.estacionId)} · revisó: {f.aprobadaPor || '—'}</Text>
          <BotonEditor titulo="Abrir" variante="secundario" alPresionar={() => props.alEditar(f)} />
        </View>
      ))}

      <Text style={e.subtitulo}>Texto del guion</Text>
      <Campo etiqueta="Buscar" ayuda="Escribe una palabra: frailejón, dunas, Kumanday…">
        <Entrada value={busqueda} onChangeText={setBusqueda} placeholder="Buscar en el guion" accessibilityLabel="Buscar en el guion" />
      </Campo>
      <View style={e.fila}>
        <Opcion etiqueta="Todas" elegida={estacion === 'todas'} alElegir={() => setEstacion('todas')} />
        {estaciones.map(x => (
          <Opcion key={x.id} etiqueta={x.nombre} elegida={estacion === x.id} alElegir={() => setEstacion(x.id)} />
        ))}
        <Opcion etiqueta="Todo el recorrido" elegida={estacion === null} alElegir={() => setEstacion(null)} />
      </View>
      <Text style={e.pequeno}>
        {encontrados.length} resultado{encontrados.length === 1 ? '' : 's'}
        {encontrados.length > MAX_RESULTADOS ? ` (se muestran ${MAX_RESULTADOS}; escribe para afinar)` : ''}
      </Text>
      {encontrados.slice(0, MAX_RESULTADOS).map(f => {
        const corregido = fichaDe(f);
        return (
          <View key={f.id} style={e.tarjeta}>
            <Text style={e.etiqueta}>{f.titulo}</Text>
            <Text style={e.pequeno}>{tituloGuion(f.guionId)}, p. {f.pagina} · {nombreEstacion(f.estacionId)}</Text>
            <Text style={e.cuerpo} numberOfLines={3}>{f.texto}</Text>
            {corregido
              ? <BotonEditor titulo={`Ver corrección (${ESTADOS[corregido.estado]})`} variante="secundario"
                  alPresionar={() => props.alEditar(corregido)} />
              : <BotonEditor titulo="Corregir este texto" variante="secundario"
                  alPresionar={() => props.alEditar(fichaNueva(f))} />}
          </View>
        );
      })}
    </>
  );
}

// ───────────────────────── Formulario ─────────────────────────

function VistaFormulario(props: {
  asistente: Asistente;
  inicial: FichaContenido;
  alTerminar: (m: Mensaje) => void;
  alProbar: (m: Mensaje) => void;
  alVolver: () => void;
}) {
  const { asistente } = props;
  const estaciones = asistente.editor.estaciones();
  const guiones = asistente.editor.guiones();
  const [f, setF] = useState<FichaContenido>(props.inicial);
  const [paginaTexto, setPaginaTexto] = useState(
    'pagina' in f.fuente && f.fuente.pagina !== undefined ? String(f.fuente.pagina) : '',
  );
  const [errores, setErrores] = useState<ReturnType<typeof erroresPorCampo>>({});
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<Mensaje>(null);

  const deGuion = 'guionId' in f.fuente;
  const cambiar = (c: Partial<FichaContenido>) => setF(prev => ({ ...prev, ...c }));
  const reemplaza = asistente.editor.fragmentosGuion().filter(x => f.reemplazaFragmentoIds.includes(x.id));

  /** La ficha tal como está en el formulario, con la página leída. */
  const armar = (): FichaContenido => {
    const pagina = leerPagina(paginaTexto);
    const fuente: FichaContenido['fuente'] = 'guionId' in f.fuente
      ? { guionId: f.fuente.guionId, pagina: pagina ?? NaN }
      : { documento: f.fuente.documento, ...(pagina !== undefined ? { pagina } : {}) };
    return { ...f, titulo: f.titulo.trim(), texto: f.texto.trim(), aprobadaPor: f.aprobadaPor.trim(), fuente };
  };

  async function ejecutar(accion: 'borrador' | 'publicar' | 'retirar', luego: 'lista' | 'probar' = 'lista') {
    setOcupado(true);
    setAviso(null);
    try {
      const ficha = armar();
      if (accion !== 'retirar') {
        const lista = asistente.fichas.validar(ficha);
        // Un borrador puede estar incompleto, pero sí necesita título para encontrarlo después.
        const bloquean = accion === 'publicar' ? lista : lista.filter(m => /título|identificador/i.test(m));
        setErrores(erroresPorCampo(lista));
        if (bloquean.length) {
          setAviso({ texto: 'Revisa los campos marcados.', tipo: 'error' });
          return;
        }
        await asistente.fichas.guardarBorrador(ficha);
      }
      if (accion === 'publicar') await asistente.fichas.activar(ficha.id);
      if (accion === 'retirar') await asistente.fichas.retirar(ficha.id);

      const textos = {
        borrador: 'Borrador guardado. Todavía no cambia las respuestas.',
        publicar: `Publicada. Versión del guion: ${asistente.versionGuion()}. Pruébala con una pregunta.`,
        retirar: `Ficha retirada: vuelve el texto original. Versión del guion: ${asistente.versionGuion()}.`,
      };
      const m: Mensaje = { texto: textos[accion], tipo: 'ok' };
      if (luego === 'probar') props.alProbar(m);
      else props.alTerminar(m);
    } catch (error) {
      setAviso({ texto: error instanceof Error ? error.message : 'No se pudo guardar.', tipo: 'error' });
    } finally {
      setOcupado(false);
    }
  }

  const publicada = props.inicial.estado === EstadoFicha.APROBADA;
  const guardada = asistente.editor.fichas().some(x => x.id === f.id);

  return (
    <>
      <Text style={e.subtitulo}>{guardada ? 'Editar ficha' : 'Ficha nueva'} · {ESTADOS[props.inicial.estado]}</Text>
      {reemplaza.length > 0 && (
        <Aviso tipo="info" texto={`Al publicarla, reemplaza este texto del guion: "${reemplaza.map(x => x.titulo).join('", "')}". El original no se borra.`} />
      )}
      {aviso ? <Aviso texto={aviso.texto} tipo={aviso.tipo} /> : null}
      {errores.general?.map(m => <Aviso key={m} texto={m} tipo="error" />)}

      <Campo etiqueta="Título" errores={errores.titulo}>
        <Entrada value={f.titulo} onChangeText={t => cambiar({ titulo: t })} conError={!!errores.titulo} accessibilityLabel="Título" />
      </Campo>

      <Campo etiqueta="Texto" ayuda="Lo que dirá el guía virtual. Frases cortas y claras." errores={errores.texto}>
        <Entrada value={f.texto} onChangeText={t => cambiar({ texto: t })} multiline conError={!!errores.texto} accessibilityLabel="Texto" />
      </Campo>

      <Campo etiqueta="Estación" errores={errores.estacionId}>
        <Opciones
          opciones={[...estaciones.map(x => ({ valor: x.id as string | null, etiqueta: x.nombre })), { valor: null, etiqueta: 'Todo el recorrido' }]}
          valor={f.estacionId}
          alCambiar={v => cambiar({ estacionId: v })}
        />
      </Campo>

      <Campo etiqueta="Tipo" errores={errores.naturaleza}>
        <Opciones opciones={TIPOS} valor={f.naturaleza} alCambiar={v => cambiar({ naturaleza: v })} />
      </Campo>

      <Campo etiqueta="Tema" errores={errores.tema}>
        <Opciones opciones={TEMAS} valor={f.tema} alCambiar={v => cambiar({ tema: v })} />
      </Campo>

      <Campo etiqueta="Fuente" ayuda="¿De dónde sale este texto?" errores={errores.fuente}>
        <View style={e.fila}>
          <Opcion etiqueta="Un guion" elegida={deGuion}
            alElegir={() => cambiar({ fuente: { guionId: guiones[0]?.id ?? '', pagina: leerPagina(paginaTexto) ?? NaN } })} />
          <Opcion etiqueta="Otro documento" elegida={!deGuion} alElegir={() => cambiar({ fuente: { documento: '' } })} />
        </View>
        {'guionId' in f.fuente ? (
          <Opciones
            opciones={guiones.map(g => ({ valor: g.id, etiqueta: g.titulo }))}
            valor={f.fuente.guionId}
            alCambiar={v => cambiar({ fuente: { guionId: v, pagina: NaN } })}
          />
        ) : (
          <Entrada value={f.fuente.documento} onChangeText={t => cambiar({ fuente: { documento: t } })}
            placeholder="Nombre del documento" accessibilityLabel="Nombre del documento" />
        )}
        <Entrada value={paginaTexto} onChangeText={setPaginaTexto} keyboardType="number-pad"
          placeholder={deGuion ? 'Página' : 'Página (opcional)'} accessibilityLabel="Página" />
      </Campo>

      <Campo etiqueta="Revisado por" ayuda="Cargo de quien revisó (no nombres de visitantes)." errores={errores.aprobadaPor}>
        <Entrada value={f.aprobadaPor} onChangeText={t => cambiar({ aprobadaPor: t })} placeholder="Ej.: Coordinación de guías"
          conError={!!errores.aprobadaPor} accessibilityLabel="Revisado por" />
      </Campo>

      <BotonEditor titulo="Guardar borrador" variante="secundario" deshabilitado={ocupado} alPresionar={() => ejecutar('borrador')} />
      <BotonEditor titulo={publicada ? 'Publicar cambios' : 'Publicar'} deshabilitado={ocupado} alPresionar={() => ejecutar('publicar', 'probar')} />
      {guardada && props.inicial.estado !== EstadoFicha.RETIRADA && (
        <BotonEditor titulo="Retirar ficha" variante="peligro" deshabilitado={ocupado} alPresionar={() => ejecutar('retirar')} />
      )}
      <BotonEditor titulo="Volver sin guardar" variante="secundario" deshabilitado={ocupado} alPresionar={props.alVolver} />
    </>
  );
}

// ───────────────────────── Probar una pregunta ─────────────────────────

function VistaProbar(props: { asistente: Asistente; alVolver: () => void }) {
  const estaciones = props.asistente.editor.estaciones();
  const [pregunta, setPregunta] = useState('');
  const [estacion, setEstacion] = useState<string | null>(null);
  const [respuesta, setRespuesta] = useState<Respuesta | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function probar() {
    setOcupado(true);
    // responder() nunca lanza
    setRespuesta(await props.asistente.orquestador.responder(pregunta, estacion, Nivel.BREVE));
    setOcupado(false);
  }

  return (
    <>
      <Text style={e.subtitulo}>Probar una pregunta</Text>
      <Text style={e.pequeno}>Comprueba que el guía virtual ya usa el texto nuevo y cita la fuente correcta.</Text>
      <Campo etiqueta="Pregunta">
        <Entrada value={pregunta} onChangeText={setPregunta} placeholder="¿Qué papel cumple el frailejón?"
          onSubmitEditing={probar} accessibilityLabel="Pregunta de prueba" />
      </Campo>
      <Campo etiqueta="Estación">
        <Opciones
          opciones={[{ valor: null as string | null, etiqueta: 'Ninguna' }, ...estaciones.map(x => ({ valor: x.id as string | null, etiqueta: x.nombre }))]}
          valor={estacion}
          alCambiar={setEstacion}
        />
      </Campo>
      <BotonEditor titulo={ocupado ? 'Pensando…' : 'Preguntar'} deshabilitado={!pregunta.trim() || ocupado} alPresionar={probar} />

      {respuesta && (
        <View style={e.tarjeta}>
          <Text style={e.pequeno}>{TIPOS_RESPUESTA[respuesta.tipo]} · {respuesta.tiempoMs} ms</Text>
          <Text style={e.cuerpo}>{respuesta.texto}</Text>
          {respuesta.citas.length > 0
            ? respuesta.citas.map(c => (
              <Text key={`${c.guionTitulo}-${c.pagina}`} style={e.etiqueta}>
                📖 {c.guionTitulo}{c.pagina > 0 ? `, p. ${c.pagina}` : ''}
              </Text>
            ))
            : <Text style={e.pequeno}>Sin cita.</Text>}
          {respuesta.advertencias.map(a => <Text key={a} style={e.pequeno}>ⓘ {a}</Text>)}
        </View>
      )}
      <BotonEditor titulo="Volver" variante="secundario" alPresionar={props.alVolver} />
    </>
  );
}

// ───────────────────────── Exportar / importar ─────────────────────────

function VistaArchivo(props: { asistente: Asistente; alImportar: (m: Mensaje) => void; alVolver: () => void }) {
  const [exportado, setExportado] = useState('');
  const [pegado, setPegado] = useState('');
  const [aviso, setAviso] = useState<Mensaje>(null);

  async function exportar() {
    try {
      setExportado(await props.asistente.fichas.exportar());
      setAviso(null);
    } catch (error) {
      setAviso({ texto: error instanceof Error ? error.message : 'No se pudo exportar.', tipo: 'error' });
    }
  }

  async function importar() {
    try {
      const fichas = await props.asistente.fichas.importar(pegado);
      props.alImportar({
        texto: `Se importaron ${fichas.length} ficha${fichas.length === 1 ? '' : 's'}. Versión del guion: ${props.asistente.versionGuion()}.`,
        tipo: 'ok',
      });
    } catch (error) {
      setAviso({ texto: error instanceof Error ? error.message : 'No se pudo importar.', tipo: 'error' });
    }
  }

  return (
    <>
      <Text style={e.subtitulo}>Llevar las fichas a otro celular</Text>
      {aviso ? <Aviso texto={aviso.texto} tipo={aviso.tipo} /> : null}

      <Campo etiqueta="Exportar" ayuda={`Copia este texto y guárdalo como ${nombreArchivoExportacion()}.`}>
        <BotonEditor titulo="Mostrar fichas para copiar" variante="secundario" alPresionar={exportar} />
        {exportado ? <Entrada value={exportado} multiline editable={false} selectTextOnFocus accessibilityLabel="Fichas exportadas" /> : null}
      </Campo>

      <Campo etiqueta="Importar" ayuda="Pega aquí el texto exportado en otro celular. Las fichas publicadas quedan activas al instante.">
        <Entrada value={pegado} onChangeText={setPegado} multiline placeholder="Pega el texto aquí" accessibilityLabel="Fichas para importar" />
        <BotonEditor titulo="Importar fichas" deshabilitado={!pegado.trim()} alPresionar={importar} />
      </Campo>

      <BotonEditor titulo="Volver" variante="secundario" alPresionar={props.alVolver} />
    </>
  );
}
