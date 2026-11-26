/**
 * Filtro previo a la búsqueda y al modelo. Si una regla coincide, devuelve una respuesta fija
 * (+ el fragmento de la norma citado, si la regla lo tiene); si no, null y el flujo sigue.
 */
import {
  MotivoLimite,
  TipoRespuesta,
  type Consulta,
  type FiltroSeguridad,
  type PaqueteContenido,
  type ReglaSeguridad,
  type Respuesta,
} from '../dominio/modelo';
import { citarFragmento } from './citas';

export function crearFiltroSeguridad(reglas: ReglaSeguridad[], paquete: PaqueteContenido): FiltroSeguridad {
  return {
    evaluar(consulta: Consulta): Respuesta | null {
      const texto = consulta.textoNormalizado;
      const regla = reglas.find(r => r.patrones.some(p => p.test(texto)));
      if (!regla) return null;

      // Solo se cita la norma si existe en el paquete y está apta; si no, queda el mensaje fijo.
      const apoyo = regla.fragmentoApoyoId
        ? paquete.fragmentos.find(f => f.id === regla.fragmentoApoyoId && f.apto)
        : undefined;

      return {
        tipo: regla.motivo === MotivoLimite.FUERA_DE_TEMA
          ? TipoRespuesta.ABSTENCION
          : TipoRespuesta.REMISION_AL_PERSONAL,
        texto: apoyo ? `${regla.mensaje}\n\n${apoyo.texto}` : regla.mensaje.replace(/\s*Esto dice el guion:$/, ''),
        citas: apoyo ? [citarFragmento(apoyo, paquete)] : [],
        motivo: regla.motivo,
        ampliable: false,
        advertencias: [],
        tiempoMs: 0, // lo pone el orquestador
      };
    },
  };
}
