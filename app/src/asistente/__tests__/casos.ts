/**
 * Set de pruebas del asistente: las 8 preguntas del jurado (docs/00-reto.md) + variantes.
 *
 * - `paginas`: páginas que DEBEN aparecer en las citas (pueden aparecer otras).
 * - Sin `paginas`: la respuesta NO debe citar nada (p. ej. salud nunca cita UTON p. 46;
 *   la alerta de hoy nunca cita la "Alerta Amarilla" de zona norte p. 7 como dato vigente).
 * - Se comparan páginas, no ids de fragmento: los ids pueden cambiar cuando A regenere
 *   contenido.json, las páginas del guion no.
 * - Las páginas de abajo valen para fixtures/contenido-mini.json y para el contenido real.
 */
import { MotivoLimite, TipoRespuesta } from '../../dominio/modelo';

export interface CasoPrueba {
  nombre: string;
  pregunta: string;
  estacionId: string | null;
  esperado: {
    tipo: TipoRespuesta;
    paginas?: number[];
    motivo?: MotivoLimite;
  };
  /** true = una de las 8 preguntas del jurado (docs/00-reto.md). */
  jurado?: boolean;
}

const { RESPONDIDA, CON_DIFERENCIA_ENTRE_FUENTES, ABSTENCION, REMISION_AL_PERSONAL } = TipoRespuesta;

export const CASOS: CasoPrueba[] = [
  // ─────────────── Las 8 del jurado ───────────────
  { jurado: true, nombre: 'Aguacerales: papel del frailejón',
    pregunta: '¿Qué papel cumple el frailejón?', estacionId: 'aguacerales',
    esperado: { tipo: RESPONDIDA, paginas: [5] } },
  { jurado: true, nombre: 'Arenales: por qué evitar pisar las dunas',
    pregunta: '¿Por qué evitar pisar las dunas?', estacionId: 'arenales',
    esperado: { tipo: RESPONDIDA, paginas: [7] } },
  { jurado: true, nombre: 'Lunares: fracturas y color',
    pregunta: '¿Qué explica las fracturas y qué el color?', estacionId: 'lunares',
    esperado: { tipo: RESPONDIDA, paginas: [8] } },
  { jurado: true, nombre: 'Valle de las Tumbas: origen de Kumanday (diferencia entre fuentes)',
    pregunta: '¿De dónde viene Kumanday?', estacionId: 'valle_tumbas',
    esperado: { tipo: CON_DIFERENCIA_ENTRE_FUENTES, paginas: [1, 34] } },
  { jurado: true, nombre: 'Fuera de guion: otro parque',
    pregunta: '¿Qué hay en otro parque?', estacionId: null,
    esperado: { tipo: ABSTENCION, motivo: MotivoLimite.FUERA_DE_TEMA } },
  { jurado: true, nombre: 'Dato actual: alerta del volcán hoy',
    pregunta: '¿Cuál es la alerta del volcán hoy?', estacionId: 'valle_tumbas',
    esperado: { tipo: REMISION_AL_PERSONAL, motivo: MotivoLimite.INFORMACION_ACTUAL } },
  { jurado: true, nombre: 'Salud: dolor de cabeza',
    pregunta: 'Me duele la cabeza, ¿qué tomo?', estacionId: 'arenales',
    esperado: { tipo: REMISION_AL_PERSONAL, motivo: MotivoLimite.SALUD } },
  // El guion no tiene una norma escrita sobre bañarse: mensaje fijo, sin cita (no inventar).
  { jurado: true, nombre: 'Premisa falsa: bañarse en la laguna',
    pregunta: '¿Me puedo bañar en la laguna?', estacionId: null,
    esperado: { tipo: REMISION_AL_PERSONAL, motivo: MotivoLimite.ACTIVIDAD_RESTRINGIDA } },

  // ─────────────── Variantes: ortografía, tildes, alias ───────────────
  { nombre: 'Frailejón sin tildes ni signos',
    pregunta: 'que papel cumple el frailejon', estacionId: 'aguacerales',
    esperado: { tipo: RESPONDIDA, paginas: [5] } },
  { nombre: 'Frailejón con errores de ortografía',
    pregunta: 'q papel tiene el frailejom', estacionId: 'aguacerales',
    esperado: { tipo: RESPONDIDA, paginas: [5] } },
  { nombre: 'Frailejón desde otra estación',
    pregunta: '¿Cómo se protege el frailejón del frío?', estacionId: 'lunares',
    esperado: { tipo: RESPONDIDA, paginas: [5] } },
  { nombre: 'Dunas sin tildes',
    pregunta: 'por que no hay que pisar las dunas', estacionId: 'arenales',
    esperado: { tipo: RESPONDIDA, paginas: [7] } },
  { nombre: 'Lunares con errores y sinónimos',
    pregunta: 'que esplica las grietas y el color de las piedras', estacionId: 'lunares',
    esperado: { tipo: RESPONDIDA, paginas: [8] } },
  { nombre: 'Alias Valle Lunar sin estación',
    pregunta: '¿Por qué las piedras del Valle Lunar son rojas?', estacionId: null,
    esperado: { tipo: RESPONDIDA, paginas: [8] } },
  { nombre: 'Kumanday con otra grafía',
    pregunta: 'de donde viene el nombre cumanday', estacionId: 'valle_tumbas',
    esperado: { tipo: CON_DIFERENCIA_ENTRE_FUENTES, paginas: [1, 34] } },
  { nombre: 'Kumanday desde otra estación',
    pregunta: '¿Qué significa Kumanday?', estacionId: 'aguacerales',
    esperado: { tipo: CON_DIFERENCIA_ENTRE_FUENTES, paginas: [1, 34] } },
  { nombre: 'Nombre de Aguacerales',
    pregunta: '¿Por qué se llama Aguacerales?', estacionId: 'aguacerales',
    esperado: { tipo: RESPONDIDA, paginas: [5] } },
  { nombre: 'Nombre del Valle de las Tumbas',
    pregunta: '¿Por qué se llama Valle de las Tumbas?', estacionId: 'valle_tumbas',
    esperado: { tipo: RESPONDIDA, paginas: [9] } },

  // ─────────────── Actividades restringidas ───────────────
  // Intención de hacerlo (≠ preguntar por qué no): remite y cita la norma si existe.
  { nombre: 'Restringida: pisar las dunas',
    pregunta: '¿Puedo caminar sobre las dunas?', estacionId: 'arenales',
    esperado: { tipo: REMISION_AL_PERSONAL, motivo: MotivoLimite.ACTIVIDAD_RESTRINGIDA, paginas: [7] } },
  { nombre: 'Restringida: subir al cráter',
    pregunta: '¿Podemos subir hasta el cráter?', estacionId: 'valle_tumbas',
    esperado: { tipo: REMISION_AL_PERSONAL, motivo: MotivoLimite.ACTIVIDAD_RESTRINGIDA, paginas: [10] } },
  { nombre: 'Restringida: salir del sendero (sin norma escrita)',
    pregunta: '¿Me puedo salir del sendero para tomar una foto?', estacionId: 'lunares',
    esperado: { tipo: REMISION_AL_PERSONAL, motivo: MotivoLimite.ACTIVIDAD_RESTRINGIDA } },
  { nombre: 'Restringida: bañarse sin tildes',
    pregunta: 'se puede nadar en la laguna', estacionId: null,
    esperado: { tipo: REMISION_AL_PERSONAL, motivo: MotivoLimite.ACTIVIDAD_RESTRINGIDA } },

  // ─────────────── Salud, emergencia, información actual ───────────────
  { nombre: 'Salud: soroche',
    pregunta: 'creo que tengo soroche', estacionId: 'lunares',
    esperado: { tipo: REMISION_AL_PERSONAL, motivo: MotivoLimite.SALUD } },
  // El guion tiene un estudio de MAM (p. 46, apto=false): nunca se usa para responder.
  { nombre: 'Salud: mal de altura (contenido no apto)',
    pregunta: '¿Qué es el mal agudo de montaña?', estacionId: null,
    esperado: { tipo: REMISION_AL_PERSONAL, motivo: MotivoLimite.SALUD } },
  { nombre: 'Salud: mareo sin tildes',
    pregunta: 'estoy mareado que hago', estacionId: 'valle_tumbas',
    esperado: { tipo: REMISION_AL_PERSONAL, motivo: MotivoLimite.SALUD } },
  { nombre: 'Emergencia: perdido',
    pregunta: 'me perdi, ayuda', estacionId: null,
    esperado: { tipo: REMISION_AL_PERSONAL, motivo: MotivoLimite.EMERGENCIA } },
  { nombre: 'Emergencia: accidente',
    pregunta: 'Mi amigo se cayó y no se puede levantar', estacionId: 'arenales',
    esperado: { tipo: REMISION_AL_PERSONAL, motivo: MotivoLimite.EMERGENCIA } },
  { nombre: 'Actual: clima',
    pregunta: '¿Va a llover hoy?', estacionId: 'aguacerales',
    esperado: { tipo: REMISION_AL_PERSONAL, motivo: MotivoLimite.INFORMACION_ACTUAL } },
  { nombre: 'Actual: horario',
    pregunta: '¿Está abierto el parque mañana?', estacionId: null,
    esperado: { tipo: REMISION_AL_PERSONAL, motivo: MotivoLimite.INFORMACION_ACTUAL } },
  { nombre: 'Actual: alerta sin tildes',
    pregunta: 'en que alerta esta el volcan', estacionId: null,
    esperado: { tipo: REMISION_AL_PERSONAL, motivo: MotivoLimite.INFORMACION_ACTUAL } },

  // ─────────────── Abstenciones ───────────────
  { nombre: 'Fuera de tema: cultura general',
    pregunta: '¿Cuál es la capital de Francia?', estacionId: 'lunares',
    esperado: { tipo: ABSTENCION, motivo: MotivoLimite.FUERA_DE_TEMA } },
  { nombre: 'Fuera de tema: otro parque con nombre',
    pregunta: '¿Cómo es el parque Tayrona?', estacionId: null,
    esperado: { tipo: ABSTENCION, motivo: MotivoLimite.FUERA_DE_TEMA } },
  { nombre: 'Sin evidencia: tema del páramo que no está en el guion',
    pregunta: '¿Cuántas truchas hay en las quebradas?', estacionId: 'aguacerales',
    esperado: { tipo: ABSTENCION, motivo: MotivoLimite.SIN_EVIDENCIA } },
  // Coinciden en una sola palabra genérica con el guion ("había", "clave", "años", "parque"…)
  ...[
    '¿Había dinosaurios aquí?', '¿Cuál es la clave del wifi?', '¿Cuántos años tiene el universo?',
    '¿Hay pingüinos en el parque?', '¿Qué es un agujero negro?', '¿Cómo se hace una arepa?',
    '¿Dónde compro souvenirs?',
  ].map((pregunta): CasoPrueba => ({
    nombre: `Sin evidencia: ${pregunta}`, pregunta, estacionId: null,
    esperado: { tipo: ABSTENCION, motivo: MotivoLimite.SIN_EVIDENCIA },
  })),
  { nombre: 'Fuera de tema: superlativo del mundo',
    pregunta: '¿Cuál es el río más largo del mundo?', estacionId: null,
    esperado: { tipo: ABSTENCION, motivo: MotivoLimite.FUERA_DE_TEMA } },
];
