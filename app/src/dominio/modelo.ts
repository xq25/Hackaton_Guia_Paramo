/**
 * Guía de páramo sin señal — Modelo de clases principal (fuente de verdad del dominio)
 * Stack: React Native + TypeScript + llama.rn + MiniSearch (todo en el celular, sin internet)
 *
 * Organización:
 *   1. Enumeraciones (vocabulario del dominio)
 *   2. Entidades de contenido (lo que sale de los guiones y de las fichas)
 *   3. Objetos de una consulta (pregunta → evidencia → respuesta)
 *   4. Servicios (el flujo que responde)
 *   5. Configuración
 *   6. Capa de juego
 *   7. Bitácora de fotos (fase futura)
 *   8. Catálogo complementario (GBIF + iNaturalist)
 *
 * Cambios respecto al diseño original: ver docs/decisiones.md (D9, D10).
 */

// ───────────────────────────── 1. ENUMERACIONES ─────────────────────────────

/** Tema del fragmento. Sale de las secciones de "Profundización" del Guion UTON 2024. */
export enum Tema {
  INTRODUCCION = 'introduccion',
  ESTACION = 'estacion',            // Guion base por estación (UTON pp. 5–10)
  GLOSARIO = 'glosario',            // UTON pp. 11–13
  GEOLOGIA = 'geologia',            // UTON pp. 15–28
  GLACIOLOGIA = 'glaciologia',      // UTON pp. 29–32
  CULTURA = 'cultura',              // Antropología, Kumanday, leyendas (UTON pp. 33–37)
  BIOLOGIA = 'biologia',            // Flora y fauna (UTON pp. 38–43)
  CLIMA = 'clima',                  // UTON pp. 44–46
  SALUD_ALTURA = 'salud_altura',    // Fisiopatología (UTON pp. 46–54): NO se usa para responder a visitantes
  BUENAS_PRACTICAS = 'buenas_practicas', // "Verdades" y errores a evitar (Guion zona norte p. 7)
}

/** Naturaleza del contenido: los relatos culturales deben distinguirse de los hechos científicos. */
export enum Naturaleza {
  CIENTIFICO = 'cientifico',
  TRADICION_ORAL = 'tradicion_oral',
  DATO_FECHADO = 'dato_fechado',    // Cifras históricas (glaciar, domo, alerta): se muestran con su fecha
  SEGURIDAD = 'seguridad',
  NORMA = 'norma',                  // Restricciones del recorrido
}

/** Nivel de detalle: primero explicación breve; si el visitante quiere, se amplía. */
export enum Nivel {
  BREVE = 'breve',
  AMPLIADO = 'ampliado',
}

export enum EstadoFicha {
  BORRADOR = 'borrador',
  APROBADA = 'aprobada',
  RETIRADA = 'retirada',
}

export enum TipoRespuesta {
  RESPONDIDA = 'respondida',
  CON_DIFERENCIA_ENTRE_FUENTES = 'con_diferencia_entre_fuentes', // p. ej. significado de Kumanday
  ABSTENCION = 'abstencion',
  REMISION_AL_PERSONAL = 'remision_al_personal',
  RESPALDO_SIN_MODELO = 'respaldo_sin_modelo', // El modelo tardó o falló: se muestra el fragmento directo
}

export enum MotivoLimite {
  SIN_EVIDENCIA = 'sin_evidencia',          // No está en los guiones
  INFORMACION_ACTUAL = 'informacion_actual', // Clima de hoy, alerta volcánica vigente, acceso
  SALUD = 'salud',                           // Síntomas, medicamentos, mal de altura
  EMERGENCIA = 'emergencia',
  FUERA_DE_TEMA = 'fuera_de_tema',           // Otro parque, temas ajenos
  ACTIVIDAD_RESTRINGIDA = 'actividad_restringida', // Bañarse en lagunas, salir del sendero, pisar dunas
}

// ─────────────────────────── 2. ENTIDADES DE CONTENIDO ───────────────────────────

/** Documento oficial que respalda las respuestas. */
export interface Guion {
  id: string;            // 'uton2024' | 'zona_norte'
  titulo: string;        // 'Guion Ecoturístico UTON 2024'
  version: string;
  totalPaginas: number;  // 57 | 7
  fechaVersion: string;  // ISO
}

/** Parada del recorrido Brisas → Valle de las Tumbas. */
export interface Estacion {
  id: string;                 // 'brisas' | 'aguacerales' | 'arenales' | 'lunares' | 'valle_tumbas'
  nombre: string;
  alias: string[];            // Lunares = 'Valle Lunar'
  orden: number;              // 0 a 4
  altitudMsnm: number | null; // Guion zona norte p. 4
  ecosistema: string;         // 'Páramo propiamente dicho', 'Superpáramo'…
  conceptoCentral: string;    // 'Génesis hídrica', 'Memoria y cambio climático'…
  icono: string;
  preguntasSugeridas: string[]; // Botones de ayuda en la interfaz
  imagen: string;               // WebP de la estación (panel de estación, doc 06)
  datosCuriososIds: string[];   // Fragmentos de "Datos curiosos" (UTON pp. 6, 7, 9, 10)
  especies: string[];           // Nombres científicos de las tablas del guion; enlazan con EspecieCatalogo
  // Capa de juego
  ubicacion: Coordenada | null; // Se toma en campo o la entrega UTON. No inventar
  radioDesbloqueoM: number;     // Respaldo por GPS (p. ej. 80 m)
  nfcTagIds: string[];          // Etiquetas NFC instaladas en la parada
}

export interface Coordenada {
  lat: number;
  lon: number;
}

/** Unidad mínima de evidencia: un trozo de texto con su página. Es lo que se busca y se cita. */
export interface Fragmento {
  id: string;
  guionId: string;
  pagina: number;
  estacionId: string | null;  // null = aplica a todo el recorrido
  tema: Tema;
  naturaleza: Naturaleza;
  nivel: Nivel;
  titulo: string;
  texto: string;
  palabrasClave: string[];
  fechaDato?: string;         // Solo para DATO_FECHADO
  apto: boolean;              // false = no se usa para responder (p. ej. salud de altura)
  origen: 'guion' | 'ficha';
  fichaId?: string;
}

export interface TerminoGlosario {
  termino: string;            // 'Gelifracción'
  definicion: string;
  guionId: string;
  pagina: number;
}

/** Equivalencias para que la búsqueda entienda al visitante ("piedras" → "rocas"). */
export interface Sinonimo {
  termino: string;
  equivalentes: string[];
}

/** Marca que dos fuentes difieren sobre un tema (Kumanday: zona norte p. 1 vs UTON p. 34). */
export interface DiferenciaEntreFuentes {
  id: string;
  tema: string;
  fragmentoIds: string[];
  nota: string;
}

/**
 * Contenido revisado que carga el personal sin tocar código, desde el editor de la app
 * con contraseña global (docs/05, D12). Se convierte en Fragmentos y se guarda en MMKV.
 */
export interface FichaContenido {
  id: string;
  titulo: string;
  estacionId: string | null;
  tema: Tema;
  naturaleza: Naturaleza;
  texto: string;
  fuente: { guionId: string; pagina: number } | { documento: string; pagina?: number };
  version: number;
  estado: EstadoFicha;
  aprobadaPor: string;        // Cargo, no datos personales del visitante
  fechaRevision: string;
  reemplazaFragmentoIds: string[];
}

/** Paquete completo que viaja dentro de la APK (contenido.json). */
export interface PaqueteContenido {
  version: string;
  generadoEn: string;
  guiones: Guion[];
  estaciones: Estacion[];
  fragmentos: Fragmento[];
  glosario: TerminoGlosario[];
  sinonimos: Sinonimo[];
  diferencias: DiferenciaEntreFuentes[];
  retos: RetoConocimiento[];  // Uno por estación interpretativa (D15); puede ir vacío
}

// ───────────────────────── 3. OBJETOS DE UNA CONSULTA ─────────────────────────

export interface Consulta {
  textoOriginal: string;
  textoNormalizado: string;
  estacionId: string | null;
  nivel: Nivel;
}

export interface ResultadoBusqueda {
  fragmento: Fragmento;
  puntaje: number;
}

export interface Evidencia {
  resultados: ResultadoBusqueda[];
  suficiente: boolean;
  diferencia?: DiferenciaEntreFuentes;
}

/** La cita la arma el sistema a partir del fragmento; nunca la escribe el modelo. */
export interface Cita {
  guionTitulo: string;
  pagina: number;
  estacionNombre: string | null;
  naturaleza: Naturaleza;
}

export interface Respuesta {
  tipo: TipoRespuesta;
  texto: string;
  citas: Cita[];
  motivo?: MotivoLimite;
  ampliable: boolean;
  advertencias: string[];     // "Dato de 2020", "Relato de tradición oral"…
  tiempoMs: number;
}

/** Regla fija de seguridad. Se evalúa antes de buscar y antes de llamar al modelo. */
export interface ReglaSeguridad {
  id: string;
  motivo: MotivoLimite;
  patrones: RegExp[];
  mensaje: string;
  fragmentoApoyoId?: string;  // p. ej. no pisar dunas: responde con la norma y su cita
}

// ─────────────────────────────── 4. SERVICIOS ───────────────────────────────

/**
 * Almacenamiento clave-valor (MMKV). Lo implementa Dev C en app/src/datos/almacen.ts y se
 * inyecta en los servicios que lo necesitan, para que nadie importe archivos de otro dev.
 * Prefijos de clave: 'progreso.' y 'config.' (Dev C), 'fichas.' (Dev B).
 */
export interface Almacen {
  leer(clave: string): string | undefined;
  escribir(clave: string, valor: string): void;
  borrar(clave: string): void;
}

/** Lee contenido.json de la APK y las fichas aprobadas guardadas en el celular. */
export interface RepositorioContenido {
  cargar(): Promise<PaqueteContenido>;
  fragmentosActivos(): Fragmento[];
  estacion(id: string): Estacion | undefined;
  guion(id: string): Guion | undefined;
}

/** Minúsculas, tildes, errores comunes y sinónimos. */
export interface NormalizadorConsulta {
  normalizar(texto: string, estacionId: string | null, nivel: Nivel): Consulta;
}

/** Filtro previo: salud, emergencia, información actual y actividades restringidas. */
export interface FiltroSeguridad {
  evaluar(consulta: Consulta): Respuesta | null; // null = puede seguir
}

/** Envoltura de MiniSearch. Prioriza la estación elegida. */
export interface MotorBusqueda {
  indexar(fragmentos: Fragmento[]): void;
  buscar(consulta: Consulta, limite: number): ResultadoBusqueda[];
}

/** Decide si hay evidencia suficiente y si las fuentes difieren. */
export interface EvaluadorEvidencia {
  evaluar(resultados: ResultadoBusqueda[], umbral: number): Evidencia;
}

/** Arma el prompt: instrucciones fijas + fragmentos + pregunta. */
export interface ConstructorPrompt {
  construir(consulta: Consulta, evidencia: Evidencia): { sistema: string; usuario: string };
}

/** Envoltura de llama.rn. */
export interface MotorModelo {
  cargar(rutaModelo: string): Promise<void>;
  generar(prompt: { sistema: string; usuario: string }, maxTokens: number, timeoutMs: number): Promise<string>;
  estaListo(): boolean;
  liberar(): Promise<void>;
}

export interface GeneradorCitas {
  citar(evidencia: Evidencia): Cita[];
}

/** Coordina todo el flujo de una pregunta. Es la única clase que usa la interfaz. */
export interface OrquestadorRespuestas {
  responder(texto: string, estacionId: string | null, nivel: Nivel): Promise<Respuesta>;
}

/** Editor del guion dentro de la app, tras la contraseña global. "Publicar" = activar + reindexar. */
export interface GestorFichas {
  desbloquear(contrasena: string): boolean;   // Compara contra el hash de pinAdministracion
  validar(ficha: FichaContenido): string[];   // Errores en lenguaje claro; vacía = válida
  guardarBorrador(ficha: FichaContenido): Promise<void>;
  activar(fichaId: string): Promise<void>;    // Sube la versión del guion y reconstruye el índice
  retirar(fichaId: string): Promise<void>;    // Vuelve al texto original del guion
  exportar(): Promise<string>;                // Ruta del archivo fichas-AAAA-MM-DD.json
  importar(rutaArchivo: string): Promise<FichaContenido[]>;
}

/** Opcional, solo si UTON lo aprueba: preguntas sin respuesta, anónimas, para crear fichas. */
export interface RegistroPreguntasSinRespuesta {
  registrar(textoNormalizado: string, estacionId: string | null, motivo: MotivoLimite): void;
  exportar(): Promise<string>;
}

// ───────────────────────────── 5. CONFIGURACIÓN ─────────────────────────────

export interface ConfiguracionApp {
  rutaModelo: string;
  umbralEvidencia: number;
  maxFragmentos: number;      // 2 o 3
  maxTokens: number;
  timeoutModeloMs: number;    // Si se supera: RESPALDO_SIN_MODELO
  pinAdministracion: string;  // Contraseña global para editar el guion, guardada con hash
  idioma: 'es' | 'en';
  // Zona del páramo
  geocercaActiva: boolean;                // D13: false por ahora (pruebas); la lógica está completa
  alcanceRestriccion: AlcanceRestriccion; // Por decisión del equipo: APP_COMPLETA
  precisionMaximaM: number;               // p. ej. 50 m
  intervaloGpsMs: number;                 // Lecturas espaciadas para ahorrar batería
  pinModoDemo: string;                    // Para la presentación fuera del parque
}

// ───────────────────────── 6. CAPA DE JUEGO (tipo Pokémon Go) ─────────────────────────

export enum MetodoRegistro {
  NFC = 'nfc',      // Principal: tocar la etiqueta de la parada
  QR = 'qr',        // Misma carga firmada que la etiqueta NFC, para celulares sin NFC (D9)
  GPS = 'gps',      // Respaldo: estar dentro del radio de la parada
  DEMO = 'demo',    // Solo para la presentación; nunca cuenta en uso real
}

export enum TipoColeccionable {
  ESTACION = 'estacion',
  ESPECIE = 'especie',
  PAISAJE = 'paisaje',
  CONCEPTO = 'concepto',   // Gelifracción, necromasa, retroceso glaciar…
}

/** Contenido grabado en la etiqueta NFC (NDEF de texto) o en el QR. La firma evita etiquetas falsas. */
export interface CargaNFC {
  v: 1;
  estacionId: string;
  tagId: string;
  firma: string;           // HMAC(estacionId + tagId) con una clave de la app
}

/** Llegada a una parada. Máximo una por estación y por día. */
export interface Visita {
  estacionId: string;
  dia: string;             // 'AAAA-MM-DD'; sin hora exacta ni ubicación guardada
  metodo: MetodoRegistro;
}

/** Carta del álbum. Su texto sale de un Fragmento, así que también tiene guion y página. */
export interface Coleccionable {
  id: string;
  tipo: TipoColeccionable;
  nombre: string;
  nombreCientifico?: string;
  estacionId: string | null;
  fragmentoIds: string[];
  imagen: string;          // WebP 480 px (carta)
  imagenMini: string;      // WebP 160 px (cuadrícula del álbum)
  credito: CreditoImagen | null; // null si la ilustración es propia
  categoriaAmenaza: CategoriaAmenaza | null; // Dato de GBIF, mostrado como "Fuente: GBIF"
  requisito: { estacionId: string; visitasMinimas: number } | { insigniaId: string };
}

/** Atribución obligatoria de la foto. */
export interface CreditoImagen {
  autor: string;
  licencia: 'CC0' | 'CC BY' | 'CC BY-NC';
  enlace: string;          // Observación o taxón en iNaturalist o GBIF
  fuente: 'GBIF' | 'iNaturalist'; // D10
}

/** Categorías de la Lista Roja de la UICN, según el campo iucnRedListCategory de GBIF. */
export enum CategoriaAmenaza {
  CR = 'CR',   // En peligro crítico
  EN = 'EN',   // En peligro
  VU = 'VU',   // Vulnerable
  NT = 'NT',   // Casi amenazada
  LC = 'LC',   // Preocupación menor
  NE = 'NE',   // No evaluada
}

/** Las especies CR, EN y VU nunca muestran ubicación de avistamientos en el mapa. */
export const OCULTAR_UBICACION = [CategoriaAmenaza.CR, CategoriaAmenaza.EN, CategoriaAmenaza.VU];

// ───────────────────────── Zona del páramo (geocerca) ─────────────────────────

/** Polígono que rodea el recorrido Brisas–Valle de las Tumbas. Se dibuja con datos reales. */
export interface ZonaRecorrido {
  nombre: string;
  poligono: Coordenada[];  // Vértices en orden; se cierra solo
  margenM: number;         // Tolerancia por error del GPS
}

export enum EstadoUbicacion {
  DENTRO = 'dentro',
  FUERA = 'fuera',
  SIN_GPS = 'sin_gps',          // Sin lectura confiable todavía
  SIMULADA = 'simulada',        // App de GPS falso detectada: se trata como FUERA
  DEMO = 'demo',                // Modo de presentación activado con PIN
}

/**
 * Qué se bloquea fuera de la zona.
 * - APP_COMPLETA: decisión del equipo. Fuera de la zona solo se ven la pantalla de bloqueo
 *   y el mensaje de seguridad, que siempre está disponible.
 * - SOLO_JUEGO: alternativa recomendada si el GPS falla en campo.
 */
export enum AlcanceRestriccion {
  APP_COMPLETA = 'app_completa',
  SOLO_JUEGO = 'solo_juego',
}

export interface ServicioZona {
  /** Exige precisión menor a precisionMaximaM y rechaza ubicaciones simuladas. */
  evaluar(posicion: Coordenada | null, precisionM: number | null, esSimulada: boolean): EstadoUbicacion;
  dentroDelPoligono(posicion: Coordenada, zona: ZonaRecorrido): boolean;
  /** true si la pantalla puede usarse en el estado actual. */
  permitido(pantalla: 'guia' | 'mapa' | 'album' | 'registro' | 'seguridad', estado: EstadoUbicacion): boolean;
}

export type CriterioInsignia =
  | { tipo: 'visitas_estacion'; estacionId: string; veces: number }
  | { tipo: 'recorrido_completo'; veces: number }
  | { tipo: 'retos_correctos'; cantidad: number }
  | { tipo: 'coleccion'; coleccionableIds: string[] };

export interface Insignia {
  id: string;
  nombre: string;
  descripcion: string;
  nivel: 1 | 2 | 3;        // Bronce, plata, oro según veces subidas
  criterio: CriterioInsignia;
}

/** Una pregunta por estación para demostrar lo aprendido. La respuesta está en el guion. */
export interface RetoConocimiento {
  id: string;
  estacionId: string;
  pregunta: string;
  opciones: string[];
  indiceCorrecta: number;
  fragmentoId: string;
}

/** Todo lo que guarda el celular. Anónimo, sin cuenta ni datos personales. */
export interface ProgresoLocal {
  visitas: Visita[];
  coleccionablesIds: string[];
  insigniasIds: string[];
  retosCorrectosIds: string[];
}

/** Lee la etiqueta NFC o el QR, comprueba el GPS o simula la llegada en modo demo. */
export interface ServicioRegistro {
  nfcDisponible(): Promise<boolean>;
  leerNFC(): Promise<CargaNFC | null>;
  leerQR(texto: string): CargaNFC | null;
  verificarFirma(carga: CargaNFC): boolean;
  estacionCercana(posicion: Coordenada): Estacion | null;
  simular(estacionId: string): Visita;
}

/** Aplica las reglas del juego. Nunca bloquea la información de seguridad. */
export interface GestorProgreso {
  cargar(): Promise<ProgresoLocal>;
  registrarVisita(estacionId: string, metodo: MetodoRegistro): Promise<{
    nueva: boolean;                 // false si ya hubo visita hoy en esa estación
    coleccionables: Coleccionable[];
    insignias: Insignia[];
  }>;
  responderReto(retoId: string, indice: number): Promise<boolean>;
  reiniciar(): Promise<void>;
}

/** Mapa Leaflet dentro de un WebView, con el archivo .pmtiles copiado en el celular. */
export interface MapaOffline {
  cargar(rutaPmtiles: string): Promise<void>;
  mostrarEstaciones(estaciones: Estacion[], progreso: ProgresoLocal): void;
  mostrarPosicion(posicion: Coordenada | null): void;
}

// ──────────────────── 7. BITÁCORA DE FOTOS (en veremos) ────────────────────

/** Fase futura. Si se prueba: clasificador TFLite con pocas especies entrenadas. */
export interface ClasificadorImagenes {
  clasificar(rutaFoto: string): Promise<{ coleccionableId: string; confianza: number }[]>;
  esSimulado: boolean;     // true en el pitch si se usan datos preparados: debe decirse
}

// ──────────────── 8. CATÁLOGO COMPLEMENTARIO (GBIF + iNaturalist) ────────────────

/** Especie del sector norte descargada en el primer arranque. Nunca entra al asistente. */
export interface EspecieCatalogo {
  gbifKey: number;
  nombreCientifico: string;
  nombreComun: string | null;      // vernacularNames de GBIF (es); null si no hay
  grupo: 'planta' | 'ave' | 'mamifero';
  estacionIds: string[];           // Estaciones donde el guion la menciona; [] = solo catálogo
  categoriaAmenaza: CategoriaAmenaza | null;
  registrosSector: number;         // Conteo de ocurrencias en el recuadro norte
  foto: string | null;             // Ruta local de la imagen descargada
  credito: CreditoImagen | null;
}

export interface EstadoSincronizacion {
  modeloListo: boolean;
  catalogoListo: boolean;
  fecha: string | null;            // 'AAAA-MM-DD' de la última sincronización
}

/** Pasos de "Preparar salida". Solo corre con internet; todo es reanudable. */
export interface ServicioSincronizacion {
  estado(): EstadoSincronizacion;
  descargarModelo(alProgreso: (fraccion: number) => void): Promise<void>;
  sincronizarCatalogo(alProgreso: (fraccion: number) => void): Promise<EspecieCatalogo[]>;
}

// ──────────────────── Datos iniciales tomados de los guiones ────────────────────

/** Campos que completa generar_contenido.py (datos curiosos, especies) o el trabajo de campo (ubicación, NFC). */
const base = (id: string) => ({
  imagen: `estaciones/${id}.webp`, datosCuriososIds: [] as string[], especies: [] as string[],
  ubicacion: null, radioDesbloqueoM: 80, nfcTagIds: [] as string[],
});

export const ESTACIONES: Estacion[] = [
  { id: 'brisas', nombre: 'Brisas', alias: ['Sector Brisas'], orden: 0, altitudMsnm: null,
    ecosistema: 'Páramo', conceptoCentral: 'Ubicación e importancia hídrica', icono: 'puerta',
    preguntasSugeridas: ['¿Por qué es importante este parque para el agua?'], ...base('brisas') },
  { id: 'aguacerales', nombre: 'Aguacerales', alias: [], orden: 1, altitudMsnm: 4160,
    ecosistema: 'Páramo propiamente dicho', conceptoCentral: 'Génesis hídrica', icono: 'gota',
    preguntasSugeridas: ['¿Qué papel cumple el frailejón en este lugar?'], ...base('aguacerales') },
  { id: 'arenales', nombre: 'Arenales', alias: ['Sector Arenales'], orden: 2, altitudMsnm: 4290,
    ecosistema: 'Transición páramo a superpáramo', conceptoCentral: 'Memoria y cambio climático', icono: 'reloj_arena',
    preguntasSugeridas: ['¿Por qué debemos evitar pisar las dunas?'], ...base('arenales') },
  { id: 'lunares', nombre: 'Lunares', alias: ['Valle Lunar'], orden: 3, altitudMsnm: 4350,
    ecosistema: 'Superpáramo', conceptoCentral: 'Fuerzas geológicas', icono: 'roca',
    preguntasSugeridas: ['¿Qué proceso explica las fracturas y cuál explica el color?'], ...base('lunares') },
  { id: 'valle_tumbas', nombre: 'Valle de las Tumbas', alias: [], orden: 4, altitudMsnm: 4460,
    ecosistema: 'Superpáramo con transición a zona nival', conceptoCentral: 'Respeto y riesgo', icono: 'advertencia',
    preguntasSugeridas: ['¿De dónde viene el nombre Kumanday?'], ...base('valle_tumbas') },
];

/**
 * Cartas de especie con las páginas donde aparecen en los guiones.
 * credito y categoriaAmenaza se completan con el catálogo (GBIF + iNaturalist); los valores
 * de abajo vienen de la consulta a GBIF del 26-11-2026 (docs/referencia/gbif-nevados.md §6).
 * Los fragmentoIds siguen el formato '<guion>-p<página>' y se crean al generar contenido.json.
 */
export const COLECCIONABLES_ESPECIE: Coleccionable[] = [
  { id: 'frailejon', tipo: TipoColeccionable.ESPECIE, nombre: 'Frailejón', nombreCientifico: 'Espeletia hartwegiana',
    estacionId: 'aguacerales', fragmentoIds: ['uton2024-p5', 'uton2024-p6', 'zona_norte-p5'],
    imagen: 'frailejon.webp', imagenMini: 'frailejon_mini.webp', credito: null, categoriaAmenaza: null, requisito: { estacionId: 'aguacerales', visitasMinimas: 1 } },
  { id: 'pajonal', tipo: TipoColeccionable.ESPECIE, nombre: 'Pajonal',
    estacionId: 'aguacerales', fragmentoIds: ['uton2024-p5', 'uton2024-p39'],
    imagen: 'pajonal.webp', imagenMini: 'pajonal_mini.webp', credito: null, categoriaAmenaza: null, requisito: { estacionId: 'aguacerales', visitasMinimas: 1 } },
  { id: 'coral_paramo', tipo: TipoColeccionable.ESPECIE, nombre: 'Coral de páramo',
    estacionId: 'lunares', fragmentoIds: ['uton2024-p8', 'uton2024-p9'],
    imagen: 'coral_paramo.webp', imagenMini: 'coral_paramo_mini.webp', credito: null, categoriaAmenaza: null, requisito: { estacionId: 'lunares', visitasMinimas: 1 } },
  { id: 'condor', tipo: TipoColeccionable.ESPECIE, nombre: 'Cóndor de los Andes', nombreCientifico: 'Vultur gryphus',
    estacionId: 'lunares', fragmentoIds: ['uton2024-p8', 'zona_norte-p2'],
    imagen: 'condor.webp', imagenMini: 'condor_mini.webp', credito: null, categoriaAmenaza: CategoriaAmenaza.VU, requisito: { estacionId: 'lunares', visitasMinimas: 2 } },
  { id: 'danta', tipo: TipoColeccionable.ESPECIE, nombre: 'Danta de montaña', nombreCientifico: 'Tapirus pinchaque',
    estacionId: null, fragmentoIds: ['uton2024-p42', 'zona_norte-p2'],
    imagen: 'danta.webp', imagenMini: 'danta_mini.webp', credito: null, categoriaAmenaza: CategoriaAmenaza.EN, requisito: { insigniaId: 'recorrido_1' } },
  { id: 'periquito', tipo: TipoColeccionable.ESPECIE, nombre: 'Periquito de los Nevados', nombreCientifico: 'Bolborhynchus ferrugineifrons',
    estacionId: null, fragmentoIds: ['uton2024-p42'],
    imagen: 'periquito.webp', imagenMini: 'periquito_mini.webp', credito: null, categoriaAmenaza: CategoriaAmenaza.VU, requisito: { insigniaId: 'sabio_paramo' } },
];

const nivelesEstacion = (e: string, nombre: string): Insignia[] =>
  ([[1, 1], [2, 3], [3, 5]] as const).map(([nivel, veces]) => ({
    id: `${e}_${nivel}`, nombre: `${nombre} ${['bronce', 'plata', 'oro'][nivel - 1]}`,
    descripcion: `Llegaste ${veces} ${veces === 1 ? 'vez' : 'veces'} a ${nombre}`,
    nivel, criterio: { tipo: 'visitas_estacion', estacionId: e, veces },
  }));

export const INSIGNIAS: Insignia[] = [
  ...ESTACIONES.flatMap(e => nivelesEstacion(e.id, e.nombre)),
  { id: 'recorrido_1', nombre: 'Explorador del Kumanday', descripcion: 'Completaste el recorrido Brisas–Valle de las Tumbas',
    nivel: 1, criterio: { tipo: 'recorrido_completo', veces: 1 } },
  { id: 'sabio_paramo', nombre: 'Sabio del páramo', descripcion: 'Respondiste bien los retos de las 4 estaciones',
    nivel: 2, criterio: { tipo: 'retos_correctos', cantidad: 4 } },
];
