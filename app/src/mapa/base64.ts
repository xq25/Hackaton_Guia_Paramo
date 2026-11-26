/** Codificación base64 de bytes, sin depender de btoa (rápida para trozos de teselas). */
const ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function bytesABase64(bytes: Uint8Array): string {
  const partes: string[] = [];
  const BLOQUE = 3 * 4096;
  for (let inicio = 0; inicio < bytes.length; inicio += BLOQUE) {
    const fin = Math.min(inicio + BLOQUE, bytes.length);
    let s = '';
    let i = inicio;
    for (; i + 2 < fin; i += 3) {
      const n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
      s += ALFABETO[(n >> 18) & 63] + ALFABETO[(n >> 12) & 63] + ALFABETO[(n >> 6) & 63] + ALFABETO[n & 63];
    }
    const resto = fin - i;
    if (resto === 1) {
      const n = bytes[i] << 16;
      s += ALFABETO[(n >> 18) & 63] + ALFABETO[(n >> 12) & 63] + '==';
    } else if (resto === 2) {
      const n = (bytes[i] << 16) | (bytes[i + 1] << 8);
      s += ALFABETO[(n >> 18) & 63] + ALFABETO[(n >> 12) & 63] + ALFABETO[(n >> 6) & 63] + '=';
    }
    partes.push(s);
  }
  return partes.join('');
}
