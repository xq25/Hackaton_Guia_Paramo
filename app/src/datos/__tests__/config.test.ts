import { CONFIG } from '../../config';
import { claveCorrecta, hashClave } from '../claves';
import { crearAlmacenMemoria } from '../almacenMemoria';

describe('config y claves', () => {
  it('los hashes de demo corresponden a las claves documentadas', () => {
    expect(claveCorrecta('paramon2026', CONFIG.pinAdministracion)).toBe(true);
    expect(claveCorrecta('2468', CONFIG.pinModoDemo)).toBe(true);
    expect(claveCorrecta('0000', CONFIG.pinModoDemo)).toBe(false);
  });

  it('hashClave es sha256 en hex', () => {
    expect(hashClave('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('geocerca desactivada (D13)', () => {
    expect(CONFIG.geocercaActiva).toBe(false);
  });
});

describe('almacén en memoria', () => {
  it('lee, escribe y borra', () => {
    const a = crearAlmacenMemoria();
    expect(a.leer('config.x')).toBeUndefined();
    a.escribir('config.x', '1');
    expect(a.leer('config.x')).toBe('1');
    a.borrar('config.x');
    expect(a.leer('config.x')).toBeUndefined();
  });
});
