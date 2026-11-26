/**
 * Las citas las arma el sistema a partir del fragmento; nunca salen del texto del modelo.
 * (B3 agrega el GeneradorCitas desde la Evidencia y las advertencias por naturaleza.)
 */
import type { Cita, Fragmento, PaqueteContenido } from '../dominio/modelo';

export function citarFragmento(f: Fragmento, paquete: PaqueteContenido): Cita {
  return {
    guionTitulo: paquete.guiones.find(g => g.id === f.guionId)?.titulo ?? f.guionId,
    pagina: f.pagina,
    estacionNombre: f.estacionId
      ? paquete.estaciones.find(e => e.id === f.estacionId)?.nombre ?? null
      : null,
    naturaleza: f.naturaleza,
  };
}
