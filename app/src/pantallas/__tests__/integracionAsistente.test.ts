import { crearAsistente } from '../../asistente';
import { CONFIG } from '../../config';
import { crearAlmacenMemoria } from '../../datos/almacenMemoria';
import { cargarPaquete } from '../../datos/repositorio';
import { Nivel, type MotorModelo } from '../../dominio/modelo';
import { formatearCita } from '../chat';

const modeloFalso: MotorModelo = {
  cargar: async () => {},
  generar: async () => 'El frailejón capta el agua de la niebla y la libera poco a poco.',
  estaListo: () => true,
  liberar: async () => {},
};

describe('integración C ↔ crearAsistente (Dev B)', () => {
  it('conecta repositorio, CONFIG calibrada, almacén y formato de citas', async () => {
    const paquete = cargarPaquete();
    const almacen = crearAlmacenMemoria();
    const asistente = crearAsistente({
      paquete,
      config: CONFIG,
      almacen,
      modelo: modeloFalso,
    });

    expect(asistente.versionGuion()).toBe('2024.1');
    await expect(asistente.precargarModelo()).resolves.toBeUndefined();

    const resp = await asistente.orquestador.responder(
      '¿Qué papel cumple el frailejón en este lugar?',
      'aguacerales',
      Nivel.BREVE
    );

    expect(resp.texto.length).toBeGreaterThan(0);
    expect(resp.citas.length).toBeGreaterThan(0);
    expect(resp.citas.map(formatearCita).some((c) => c.includes('UTON 2024'))).toBe(true);

    await expect(asistente.liberarModelo()).resolves.toBeUndefined();
  });
});
