/**
 * Decide si hay evidencia suficiente y si las fuentes difieren.
 * - suficiente: el mejor puntaje alcanza `umbral` (ConfiguracionApp.umbralEvidencia).
 * - Se quedan los resultados cercanos al mejor (≥ CORTE_RELATIVO), para que las citas sean
 *   pertinentes y no decorativas. Excepción: un fragmento de la MISMA parada que el mejor, que
 *   supera el umbral y cubre otra palabra de la pregunta ("¿qué explica las fracturas y qué el
 *   color?" → gelifracción + oxidación).
 * - DiferenciaEntreFuentes: el mejor resultado es parte de la diferencia, o la tocan 2 o más
 *   resultados. Entonces se agregan TODOS sus fragmentos, para mostrar ambas versiones.
 */
import type {
  DiferenciaEntreFuentes,
  EvaluadorEvidencia,
  Evidencia,
  PaqueteContenido,
  ResultadoBusqueda,
} from '../dominio/modelo';

const CORTE_RELATIVO = 0.5;

const terminosDe = (r: ResultadoBusqueda): string[] =>
  'terminos' in r && Array.isArray(r.terminos) ? (r.terminos as string[]) : [];

export function crearEvaluadorEvidencia(paquete: PaqueteContenido): EvaluadorEvidencia {
  return {
    evaluar(resultados: ResultadoBusqueda[], umbral: number): Evidencia {
      const mejor = resultados[0];
      if (!mejor || mejor.puntaje < umbral) return { resultados: [], suficiente: false };

      const cubiertos = new Set<string>();
      const cercanos = resultados.filter(r => {
        const nuevos = terminosDe(r).filter(t => !cubiertos.has(t));
        const entra = r === mejor
          || r.puntaje >= mejor.puntaje * CORTE_RELATIVO
          || (r.puntaje >= umbral && nuevos.length > 0
              && r.fragmento.estacionId === mejor.fragmento.estacionId);
        if (entra) terminosDe(r).forEach(t => cubiertos.add(t));
        return entra;
      });

      const diferencia = buscarDiferencia(paquete.diferencias ?? [], cercanos);
      if (!diferencia) return { resultados: cercanos, suficiente: true };

      // Ambas versiones, en el orden de la diferencia, con el puntaje que tenían (o 0).
      const versiones = diferencia.fragmentoIds.flatMap(id => {
        const enResultados = cercanos.find(r => r.fragmento.id === id);
        if (enResultados) return [enResultados];
        const fragmento = paquete.fragmentos.find(f => f.id === id && f.apto);
        return fragmento ? [{ fragmento, puntaje: 0 }] : [];
      });
      return { resultados: versiones, suficiente: true, diferencia };
    },
  };
}

function buscarDiferencia(
  diferencias: DiferenciaEntreFuentes[],
  resultados: ResultadoBusqueda[],
): DiferenciaEntreFuentes | undefined {
  const ids = resultados.map(r => r.fragmento.id);
  return diferencias.find(d =>
    d.fragmentoIds.includes(ids[0]) || d.fragmentoIds.filter(id => ids.includes(id)).length >= 2,
  );
}
