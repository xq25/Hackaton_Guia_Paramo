/**
 * Estilo común de ParamON (doc 06): alto contraste para sol fuerte, letra grande,
 * botones grandes para usar con guantes. A y B lo importan (solo lectura).
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
  titulo: 28,
  subtitulo: 22,
  cuerpo: 18,
  pequeno: 15,
  /** Interlineado recomendado para el cuerpo. */
  interlineado: 26,
  pesoNormal: '400',
  pesoFuerte: '700',
} as const;

export const espacio = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
} as const;

export const tamanos = {
  /** Alto mínimo de cualquier botón tocable (guantes). */
  botonAlto: 56,
  /** Área mínima tocable de íconos. */
  toqueMinimo: 48,
  radio: 12,
  radioHoja: 20,
  bordeGrueso: 2,
} as const;

export const tema = { colores, tipografia, espacio, tamanos } as const;
export default tema;
