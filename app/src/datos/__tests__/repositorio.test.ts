import { Tema } from '../../dominio/modelo';
import { cargarCatalogo, cargarPaquete, crearRepositorioContenido } from '../repositorio';

describe('repositorio (contenido.json y catalogo.json de A)', () => {
  it('carga las 5 estaciones, los 2 guiones y fragmentos válidos', () => {
    const paquete = cargarPaquete();
    expect(paquete.guiones).toHaveLength(2);
    expect(paquete.estaciones).toHaveLength(5);
    expect(paquete.fragmentos.length).toBeGreaterThan(200);
    expect(paquete.retos).toHaveLength(4);
  });

  it('ningún fragmento de SALUD_ALTURA aparece como apto en fragmentosActivos', () => {
    const repo = crearRepositorioContenido();
    const activos = repo.fragmentosActivos();
    expect(activos.length).toBeGreaterThan(0);
    expect(activos.some((f) => f.tema === Tema.SALUD_ALTURA)).toBe(false);
    expect(repo.estacion('lunares')?.nombre).toBe('Lunares');
    expect(repo.guion('uton2024')?.totalPaginas).toBe(57);
  });

  it('carga el catálogo semilla GBIF con claves válidas', () => {
    const catalogo = cargarCatalogo();
    expect(catalogo.length).toBeGreaterThan(10);
    expect(catalogo.some((e) => e.nombreCientifico === 'Espeletia hartwegiana')).toBe(true);
  });
});
