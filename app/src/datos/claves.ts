/** Comparación de contraseñas/PIN contra los hashes de CONFIG (sha256 en hex). */
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';

export function hashClave(texto: string): string {
  return bytesToHex(sha256(utf8ToBytes(texto)));
}

export function claveCorrecta(texto: string, hashEsperado: string): boolean {
  return hashClave(texto.trim()) === hashEsperado;
}
