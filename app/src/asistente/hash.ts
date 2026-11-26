/** SHA-256 en hex. Rutas válidas en @noble/hashes 1.8 y 2.x. */
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';

export function sha256Hex(texto: string): string {
  return bytesToHex(sha256(utf8ToBytes(texto)));
}
