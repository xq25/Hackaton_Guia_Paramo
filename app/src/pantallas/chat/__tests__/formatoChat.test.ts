import { ESTACIONES, Naturaleza, Nivel, TipoRespuesta } from '../../../dominio/modelo';
import { esRespuestaLimite, formatearCita, orquestadorMaqueta, sugerenciasRecorrido } from '../formatoChat';

describe('formatoChat', () => {
  it('formatea la cita con guion, página y estación cuando existe, y omite página 0 en documentos externos', () => {
    expect(
      formatearCita({
        guionTitulo: 'Guion Ecoturístico UTON 2024',
        pagina: 8,
        estacionNombre: 'Lunares',
        naturaleza: Naturaleza.CIENTIFICO,
      })
    ).toBe('Guion Ecoturístico UTON 2024 · p. 8 · Lunares');

    expect(
      formatearCita({
        guionTitulo: 'Guion Zona Norte',
        pagina: 1,
        estacionNombre: null,
        naturaleza: Naturaleza.TRADICION_ORAL,
      })
    ).toBe('Guion Zona Norte · p. 1');

    expect(
      formatearCita({
        guionTitulo: 'Circular Operativa UTON',
        pagina: 0,
        estacionNombre: 'Arenales',
        naturaleza: Naturaleza.NORMA,
      })
    ).toBe('Circular Operativa UTON · Arenales');
  });

  it('distingue abstenciones y remisiones de respuestas normales', () => {
    expect(esRespuestaLimite(TipoRespuesta.ABSTENCION)).toBe(true);
    expect(esRespuestaLimite(TipoRespuesta.REMISION_AL_PERSONAL)).toBe(true);
    expect(esRespuestaLimite(TipoRespuesta.RESPONDIDA)).toBe(false);
    expect(esRespuestaLimite(TipoRespuesta.RESPALDO_SIN_MODELO)).toBe(false);
  });

  it('reúne preguntas sugeridas sin duplicar', () => {
    const sugs = sugerenciasRecorrido(ESTACIONES);
    expect(sugs.length).toBeGreaterThan(0);
    expect(sugs.length).toBeLessThanOrEqual(4);
  });

  it('la maqueta soporta nivel BREVE (ampliable) y AMPLIADO (no ampliable)', async () => {
    const breve = await orquestadorMaqueta.responder('¿De dónde viene Kumanday?', 'valle_tumbas', Nivel.BREVE);
    expect(breve.ampliable).toBe(true);
    expect(breve.citas.length).toBe(2);

    const amp = await orquestadorMaqueta.responder('¿De dónde viene Kumanday?', 'valle_tumbas', Nivel.AMPLIADO);
    expect(amp.ampliable).toBe(false);
  });
});
