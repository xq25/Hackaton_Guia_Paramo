/**
 * Estilos provisionales de las pantallas de juego.
 * TODO(S10): cuando C mergee pantallas/tema.ts y pantallas/comunes/, reemplazar estos valores por los del tema.
 */
import { IMAGENES } from '../../../assets/imagenes/indice';

export const COLORES = {
  fondo: '#F4F1EA',
  tarjeta: '#FFFFFF',
  texto: '#1F2A24',
  textoSuave: '#5B665F',
  bloqueado: '#C9CCC7',
  acento: '#2F6B4F',
  bronce: '#B0793E',
  plata: '#8C979C',
  oro: '#C9A227',
  amenaza: '#B3261E',
};

export const NIVEL_COLOR: Record<1 | 2 | 3, string> = { 1: COLORES.bronce, 2: COLORES.plata, 3: COLORES.oro };

/** Busca una imagen empaquetada por su ruta; las cartas de especie traen solo el nombre de archivo. */
export function imagenDe(ruta: string | null | undefined): number | undefined {
  if (!ruta) return undefined;
  return IMAGENES[ruta] ?? IMAGENES[`especies/${ruta}`];
}
