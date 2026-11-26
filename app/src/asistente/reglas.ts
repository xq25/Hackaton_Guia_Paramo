/**
 * Reglas fijas de seguridad (datos). Se evalúan EN ORDEN, antes de buscar y antes del modelo:
 * la primera que coincide gana. Los patrones se aplican al texto normalizado
 * (minúsculas, sin tildes, sin signos; ver normalizador.ts).
 *
 * Criterios:
 * - Mensajes cortos, en español claro, siempre remitiendo al guía o al personal.
 * - Nunca indicaciones de seguridad propias: solo remisión o el fragmento citado del guion.
 * - ACTIVIDAD_RESTRINGIDA detecta la INTENCIÓN de hacerlo ("¿puedo pisar las dunas?"), no la
 *   pregunta por la razón ("¿por qué evitar pisar las dunas?"), que se responde con el guion.
 * - fragmentoApoyoId: si el guion trae la norma, se cita. Laguna y sendero no tienen norma
 *   escrita en los guiones: mensaje fijo sin cita (no inventar).
 *   ⚠ Los ids son los del fixture; revisar contra contenido.json real en B5.
 */
import { MotivoLimite, type ReglaSeguridad } from '../dominio/modelo';

const REMITE = 'Pregúntale a tu guía o al personal del parque.';
const REGLAS_VIGENTES = 'Las reglas vigentes las da tu guía o el personal del parque.';

/** "¿puedo…?", "¿se puede…?", "¿nos dejan…?", "quiero…" */
const INTENCION = String.raw`\b(puedo|podemos|puede|se puede|me puedo|nos podemos|dejan|permiten|permitido|es posible|esta bien|quiero|queremos|vamos a)\b`;

export const REGLAS: ReglaSeguridad[] = [
  // ───────────── Emergencia ─────────────
  {
    id: 'emergencia',
    motivo: MotivoLimite.EMERGENCIA,
    patrones: [
      /\b(me perdi|nos perdimos|estoy perdid|estamos perdid|perdi a|se perdio)/,
      /\b(auxilio|socorro|emergencia|rescate|ayuda urgente)\b/,
      /\b(se cayo|me cai|nos caimos|se golpeo|herid[oa]s?|sangr|desmay|inconsciente|no reacciona)/,
      /\bno (se )?(puede|puedo) (respirar|levantar|mover|caminar)/,
    ],
    mensaje: 'Si es una emergencia, avisa de inmediato a tu guía o al personal del parque.',
  },

  // ───────────── Salud ─────────────
  {
    id: 'salud',
    motivo: MotivoLimite.SALUD,
    patrones: [
      /\b(me duele|le duele|nos duele|dolor de|duele la)\b/,
      /\b(mare[oa]|mareado|mareada|soroche|nausea|vomit|fiebre|asma|hipotermia|hipoxia)/,
      /\bmal (agudo )?de (altura|montana|paramo)\b|\bmal agudo\b/,
      /\b(pastilla|medicament|medicina|remedio|acetaminofen|ibuprofeno|que (me )?tomo|que tomar)/,
      /\b(me siento mal|se siente mal|enferm|sintoma|embarazad|presion (alta|baja|arterial)|falta (de )?aire|me ahogo)/,
    ],
    mensaje: `No puedo dar consejos de salud ni recomendar medicamentos. Avisa a tu guía o al personal del parque: ellos saben cómo ayudarte.`,
  },

  // ───────────── Información actual ─────────────
  {
    id: 'informacion_actual',
    motivo: MotivoLimite.INFORMACION_ACTUAL,
    patrones: [
      /\b(hoy|ahora|ahorita|manana|en este momento|esta semana|este fin de semana)\b/,
      /\b(alerta|pronostico|va a llover|esta lloviendo|va a nevar|esta nevando)\b/,
      /\b(esta abierto|esta cerrado|abren|cierran|horario|cuanto cuesta|precio|tarifa)\b/,
      /\b(erupcion|actividad) (reciente|actual)\b/,
    ],
    mensaje: `No tengo información en vivo (clima, alertas del volcán, horarios). ${REMITE}`,
  },

  // ───────────── Actividades restringidas ─────────────
  {
    id: 'restringida_laguna',
    motivo: MotivoLimite.ACTIVIDAD_RESTRINGIDA,
    patrones: [
      /\b(banar|banarme|banarnos|banarse|nadar|meterme|meternos|meterse|zambullir)\b.*\b(laguna|lago|agua|quebrada|rio)\b/,
    ],
    mensaje: `Eso no hace parte del recorrido. ${REGLAS_VIGENTES} Pregúntales antes de hacerlo.`,
  },
  {
    id: 'restringida_sendero',
    motivo: MotivoLimite.ACTIVIDAD_RESTRINGIDA,
    patrones: [
      /\b(salir|salirme|salirnos|salirse|apartarme|apartarnos|desviarme|desviarnos|meterme)\b.*\b(sendero|camino|ruta|trocha)\b/,
      /\bfuera del (sendero|camino)\b/,
    ],
    mensaje: `Camina siempre por donde indique tu guía. ${REGLAS_VIGENTES}`,
  },
  {
    id: 'restringida_dunas',
    motivo: MotivoLimite.ACTIVIDAD_RESTRINGIDA,
    patrones: [
      new RegExp(`${INTENCION}.*\\b(pisar|pisarlas|caminar|subir|subirme|jugar|correr|rodar|sentar|acostar|tirarme)\\b.*\\bdunas?\\b`),
    ],
    mensaje: `${REGLAS_VIGENTES} Esto dice el guion:`,
    fragmentoApoyoId: 'uton2024-p7-3',
  },
  {
    id: 'restringida_ascenso',
    motivo: MotivoLimite.ACTIVIDAD_RESTRINGIDA,
    patrones: [
      new RegExp(`${INTENCION}.*\\b(subir|ir|llegar|ascender|escalar|caminar)\\b.*\\b(crater|cumbre|cima|glaciar|nevado|arriba|volcan)\\b`),
    ],
    mensaje: `${REGLAS_VIGENTES} Esto dice el guion:`,
    fragmentoApoyoId: 'uton2024-p10-2',
  },
  {
    id: 'restringida_extraer',
    motivo: MotivoLimite.ACTIVIDAD_RESTRINGIDA,
    patrones: [
      /\b(llevarme|llevarnos|llevarse|llevar|arrancar|coger|recoger|sacar)\b.*\b(piedras?|rocas?|plantas?|frailejon(es)?|flor(es)?|arena)\b/,
      /\b(alimentar|dar de comer)\b/,
    ],
    mensaje: `En el parque no se debe sacar ni alterar nada sin permiso. ${REGLAS_VIGENTES}`,
  },

  // ───────────── Fuera de tema ─────────────
  {
    id: 'fuera_de_tema',
    motivo: MotivoLimite.FUERA_DE_TEMA,
    patrones: [
      /\botros? parques?\b/,
      /\b(tayrona|chingaza|purace|cocuy|sumapaz|amacayacu|iguaque|gorgona|farallones|katios|yellowstone|galapagos)\b/,
      /\b(capital de|presidente|futbol|receta|pelicula|cancion|chiste|horoscopo|bitcoin|tarea de)\b/,
    ],
    mensaje: 'Solo puedo responder sobre el recorrido Brisas – Valle de las Tumbas del PNN Los Nevados, con lo que dicen sus guiones. Para otros temas, pregúntale a tu guía.',
  },
];
