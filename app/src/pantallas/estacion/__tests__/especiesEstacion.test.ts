import {
  CategoriaAmenaza,
  ESTACIONES,
  Naturaleza,
  Nivel,
  Tema,
  type EspecieCatalogo,
  type Fragmento,
} from '../../../dominio/modelo';
import {
  buscarCaracteristicasEspecie,
  construirEspeciesEstacion,
  debeOcultarUbicacion,
  describirAmenazaUicn,
} from '../especiesEstacion';

describe('especiesEstacion', () => {
  it('aplica la regla OCULTAR_UBICACION a CR, EN y VU', () => {
    expect(debeOcultarUbicacion(CategoriaAmenaza.CR)).toBe(true);
    expect(debeOcultarUbicacion(CategoriaAmenaza.EN)).toBe(true);
    expect(debeOcultarUbicacion(CategoriaAmenaza.VU)).toBe(true);
    expect(debeOcultarUbicacion(CategoriaAmenaza.LC)).toBe(false);
    expect(debeOcultarUbicacion(null)).toBe(false);
  });

  it('cruza Estacion.especies con el catálogo GBIF sin duplicar cartas especiales', () => {
    const lunares = { ...ESTACIONES[3], especies: ['Vultur gryphus', 'Senecio canescens'] };
    const catalogo: EspecieCatalogo[] = [
      {
        gbifKey: 2481940,
        nombreCientifico: 'Vultur gryphus',
        nombreComun: 'Cóndor andino',
        grupo: 'ave',
        estacionIds: ['lunares'],
        categoriaAmenaza: CategoriaAmenaza.VU,
        registrosSector: 12,
        foto: 'condor.webp',
        credito: {
          autor: 'Autor Ejemplo',
          licencia: 'CC BY',
          enlace: 'https://www.inaturalist.org/observations/1',
          fuente: 'iNaturalist',
        },
      },
    ];

    const lista = construirEspeciesEstacion(lunares, catalogo);
    const condor = lista.find((e) => e.nombreCientifico === 'Vultur gryphus');
    expect(condor).toBeDefined();
    expect(condor?.ocultarUbicacion).toBe(true);
    expect(describirAmenazaUicn(condor?.categoriaAmenaza ?? null)).toContain('Fuente: GBIF');
    // Vultur gryphus aparece una sola vez aunque esté en Estacion.especies, catálogo y COLECCIONABLES_ESPECIE
    expect(lista.filter((e) => e.nombreCientifico === 'Vultur gryphus').length).toBe(1);
  });

  it('ignora fragmentos no aptos (salud) al buscar características', () => {
    const lunares = ESTACIONES[3];
    const [coral] = construirEspeciesEstacion(lunares, []);
    const fragmentos: Fragmento[] = [
      {
        id: 'uton2024-p8-1',
        guionId: 'uton2024',
        pagina: 8,
        estacionId: 'lunares',
        tema: Tema.BIOLOGIA,
        naturaleza: Naturaleza.CIENTIFICO,
        nivel: Nivel.BREVE,
        titulo: 'Coral de páramo',
        texto: 'Planta adaptada al superpáramo rocoso.',
        palabrasClave: ['coral'],
        apto: true,
        origen: 'guion',
      },
      {
        id: 'uton2024-p48-1',
        guionId: 'uton2024',
        pagina: 48,
        estacionId: null,
        tema: Tema.SALUD_ALTURA,
        naturaleza: Naturaleza.SEGURIDAD,
        nivel: Nivel.BREVE,
        titulo: 'Salud',
        texto: 'Coral de páramo no apto.',
        palabrasClave: [],
        apto: false,
        origen: 'guion',
      },
    ];

    const hallados = buscarCaracteristicasEspecie(coral, fragmentos, [
      { id: 'uton2024', titulo: 'Guion Ecoturístico UTON 2024', version: '1.0', totalPaginas: 57, fechaVersion: '2024-01-01' },
    ]);
    expect(hallados.length).toBe(1);
    expect(hallados[0].citaTexto).toBe('Guion Ecoturístico UTON 2024 · p. 8');
  });
});
