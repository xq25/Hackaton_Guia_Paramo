import { crearAlmacenMemoria } from '../../datos/almacenMemoria';
import { cargarCatalogo, cargarPaquete } from '../../datos/repositorio';
import { MetodoRegistro } from '../../dominio/modelo';
import { crearGestorProgreso } from '../../juego';
import { construirEspeciesEstacion } from '../estacion';

describe('integración C ↔ ProgresoJuego (contrato revisado de Dev A)', () => {
  it('conecta repositorio, visitas demo, desbloqueo de especies y reinicio', async () => {
    const paquete = cargarPaquete();
    const catalogo = cargarCatalogo();
    const almacen = crearAlmacenMemoria();
    const progreso = crearGestorProgreso({ paquete, almacen });

    const inicial = await progreso.cargar();
    expect(progreso.estacionVisitada(inicial, 'aguacerales')).toBe(false);

    const aguacerales = paquete.estaciones.find((e) => e.id === 'aguacerales')!;
    const especiesAguacerales = construirEspeciesEstacion(aguacerales, catalogo);
    expect(especiesAguacerales.length).toBeGreaterThan(0);

    for (const esp of especiesAguacerales) {
      if (esp.nombreCientifico) {
        expect(progreso.especieDesbloqueada(inicial, esp.nombreCientifico)).toBe(false);
      }
    }

    const res = await progreso.registrarVisita('aguacerales', MetodoRegistro.DEMO);
    expect(res.nueva).toBe(true);
    expect(res.insignias.some((i) => i.id === 'aguacerales_1')).toBe(true);

    const trasVisita = await progreso.cargar();
    expect(progreso.estacionVisitada(trasVisita, 'aguacerales')).toBe(true);
    expect(progreso.especieDesbloqueada(trasVisita, 'Espeletia hartwegiana')).toBe(true);

    await progreso.reiniciar();
    const reiniciado = await progreso.cargar();
    expect(progreso.estacionVisitada(reiniciado, 'aguacerales')).toBe(false);
  });
});
