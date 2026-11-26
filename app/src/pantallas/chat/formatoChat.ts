import {
  MotivoLimite,
  Naturaleza,
  Nivel,
  TipoRespuesta,
  type Cita,
  type Estacion,
  type OrquestadorRespuestas,
  type Respuesta,
} from '../../dominio/modelo';

/** Cita visible debajo de cada respuesta: "Guion Ecoturístico UTON 2024 · p. 8 · Lunares". */
export function formatearCita(cita: Cita): string {
  const partes = [cita.guionTitulo, `p. ${cita.pagina}`];
  if (cita.estacionNombre) partes.push(cita.estacionNombre);
  return partes.join(' · ');
}

/** Abstenciones y remisiones usan estilo propio (azul informativo, nunca rojo de error). */
export function esRespuestaLimite(tipo: TipoRespuesta): boolean {
  return (
    tipo === TipoRespuesta.ABSTENCION ||
    tipo === TipoRespuesta.REMISION_AL_PERSONAL
  );
}

/** Preguntas sugeridas para cuando está elegido "Todo el recorrido". */
export function sugerenciasRecorrido(estaciones: Estacion[]): string[] {
  const vistas = new Set<string>();
  const lista: string[] = [];
  for (const est of [...estaciones].sort((a, b) => a.orden - b.orden)) {
    for (const p of est.preguntasSugeridas) {
      if (!vistas.has(p)) {
        vistas.add(p);
        lista.push(p);
      }
      if (lista.length >= 4) return lista;
    }
  }
  return lista;
}

/**
 * Datos de maqueta escritos en el componente para probar la interfaz mientras llega S1 (B0).
 * Apenas se inyecta `orquestador` desde `crearAsistente` (S1), este respaldo deja de usarse.
 */
export const orquestadorMaqueta: OrquestadorRespuestas = {
  async responder(texto: string, estacionId: string | null, nivel: Nivel): Promise<Respuesta> {
    const q = texto.toLowerCase();
    if (q.includes('mareo') || q.includes('duele') || q.includes('soroche')) {
      return {
        tipo: TipoRespuesta.REMISION_AL_PERSONAL,
        texto: 'No doy indicaciones médicas. Avisa de inmediato a tu guía o al personal del parque.',
        citas: [],
        motivo: MotivoLimite.SALUD,
        ampliable: false,
        advertencias: [],
        tiempoMs: 5,
      };
    }
    if (q.includes('kumanday')) {
      return {
        tipo: TipoRespuesta.CON_DIFERENCIA_ENTRE_FUENTES,
        texto:
          nivel === Nivel.AMPLIADO
            ? 'Los dos guiones recogen tradiciones distintas sobre el nombre indígena Kumanday: uno lo traduce como "Blanco hermoso" y otro lo vincula con relatos ancestrales del macizo volcánico.'
            : 'Los dos guiones presentan versiones distintas sobre el significado de Kumanday.',
        citas: [
          {
            guionTitulo: 'Guion Ecoturístico UTON 2024',
            pagina: 34,
            estacionNombre: 'Valle de las Tumbas',
            naturaleza: Naturaleza.TRADICION_ORAL,
          },
          {
            guionTitulo: 'Guion Zona Norte',
            pagina: 1,
            estacionNombre: null,
            naturaleza: Naturaleza.TRADICION_ORAL,
          },
        ],
        ampliable: nivel === Nivel.BREVE,
        advertencias: ['Relato de tradición oral'],
        tiempoMs: 12,
      };
    }
    if (q.includes('clima') || q.includes('alerta') || q.includes('hoy')) {
      return {
        tipo: TipoRespuesta.ABSTENCION,
        texto: 'Eso no está en el guion ni tengo datos en vivo. Pregúntale a tu guía o al personal del parque.',
        citas: [],
        motivo: MotivoLimite.INFORMACION_ACTUAL,
        ampliable: false,
        advertencias: [],
        tiempoMs: 4,
      };
    }
    return {
      tipo: TipoRespuesta.RESPALDO_SIN_MODELO,
      texto:
        nivel === Nivel.AMPLIADO
          ? 'El ecosistema de páramo y superpáramo regula el ciclo del agua gracias a la vegetación como el frailejón, los pajonales y los suelos volcánicos que almacenan humedad.'
          : 'El páramo capta y regula el agua que abastece a las cuencas de la región.',
      citas: [
        {
          guionTitulo: 'Guion Ecoturístico UTON 2024',
          pagina: estacionId === 'lunares' ? 8 : 5,
          estacionNombre: estacionId === 'lunares' ? 'Lunares' : 'Aguacerales',
          naturaleza: Naturaleza.CIENTIFICO,
        },
      ],
      ampliable: nivel === Nivel.BREVE,
      advertencias: [],
      tiempoMs: 8,
    };
  },
};
