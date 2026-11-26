/**
 * Estilo común de ParamON (doc 06): alto contraste para sol fuerte y proporciones
 * equilibradas para pantallas móviles compactas. A y B lo importan (solo lectura).
 * Regla: se agregan claves, no se quitan ni renombran sin OK de A y B.
 */

export const colores = {
  fondo: '#FFFFFF',
  superficie: '#F2F4F1',
  texto: '#111111',
  textoSuave: '#3D3D3D',
  textoInverso: '#FFFFFF',
  borde: '#1B1B1B',

  primario: '#14532D',        // Verde páramo oscuro (contraste AAA sobre blanco)
  primarioSuave: '#DCEFE1',
  acento: '#B45309',          // Ocre, para resaltar (frailejón seco)
  acentoSuave: '#FDF0DD',

  /** Abstenciones y remisiones: tono neutro azul, no parece error. */
  aviso: '#1E3A8A',
  avisoSuave: '#E3E9FA',
  /** Solo para Seguridad. */
  seguridad: '#B91C1C',
  seguridadSuave: '#FDE4E4',

  /** Pines y especies. */
  sinVisitar: '#8A8A8A',
  visitada: '#15803D',
  bloqueada: '#BDBDBD',

  /** Insignias. */
  bronce: '#A0522D',
  plata: '#8C8C8C',
  oro: '#B8860B',

  velo: 'rgba(0,0,0,0.45)',
} as const;

export const tipografia = {
  titulo: 22,
  subtitulo: 18,
  cuerpo: 15,
  pequeno: 13,
  /** Interlineado cómodo en pantallas de celular. */
  interlineado: 22,
  pesoNormal: '400',
  pesoFuerte: '700',
} as const;

export const espacio = {
  xs: 4,
  s: 8,
  m: 12,
  l: 18,
  xl: 24,
} as const;

export const tamanos = {
  /** Alto cómodo y compacto de botones tocables. */
  botonAlto: 46,
  /** Área mínima tocable de íconos. */
  toqueMinimo: 40,
  radio: 10,
  radioHoja: 18,
  bordeGrueso: 1.5,
} as const;

export const tema = { colores, tipografia, espacio, tamanos } as const;
export default tema;
