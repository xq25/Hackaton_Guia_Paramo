/**
 * Las citas las arma el sistema a partir de los fragmentos; nunca salen del texto del modelo.
 * También las advertencias por naturaleza del contenido.
 */
import {
  Naturaleza,
  type Cita,
  type Evidencia,
  type Fragmento,
  type GeneradorCitas,
  type PaqueteContenido,
} from '../dominio/modelo';

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

/** Una cita por guion + página (varios fragmentos de la misma página = una sola cita). */
export function crearGeneradorCitas(paquete: PaqueteContenido): GeneradorCitas {
  return {
    citar(evidencia: Evidencia): Cita[] {
      const vistas = new Set<string>();
      return evidencia.resultados.flatMap(({ fragmento }) => {
        const clave = `${fragmento.guionId}#${fragmento.pagina}`;
        if (vistas.has(clave)) return [];
        vistas.add(clave);
        return [citarFragmento(fragmento, paquete)];
      });
    },
  };
}

/** "Relato de tradición oral", "Dato de 1985"… sin repetir. */
export function advertencias(fragmentos: Fragmento[]): string[] {
  const lista = fragmentos.flatMap(f => {
    if (f.naturaleza === Naturaleza.TRADICION_ORAL) return ['Relato de tradición oral'];
    if (f.naturaleza === Naturaleza.DATO_FECHADO) {
      return [f.fechaDato
        ? `Dato de ${f.fechaDato.slice(0, 4)}`
        : 'Dato con fecha: puede haber cambiado, confírmalo con el personal'];
    }
    return [];
  });
  return [...new Set(lista)];
}
