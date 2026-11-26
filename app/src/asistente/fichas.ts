/**
 * GestorFichas: el personal cambia lo que dice el guía virtual sin tocar código (docs/05).
 *
 * - desbloquear: sha256(contraseña) vs config.pinAdministracion (hash hex). Sin desbloquear,
 *   las operaciones que escriben lanzan un error con mensaje claro.
 * - Una ficha APROBADA se vuelve un Fragmento (origen 'ficha') y oculta los fragmentos de
 *   `reemplazaFragmentoIds`. El original nunca se borra: al retirar la ficha, vuelve.
 * - Publicar o retirar sube la versión del guion y reindexa al instante (sin reiniciar).
 * - Persistencia: almacen['fichas.v1'] = { publicaciones, fichas }.
 * - exportar() devuelve el JSON como texto e importar() recibe ese texto: escribir o leer el
 *   archivo (fichas-AAAA-MM-DD.json) lo hace la pantalla del editor, no este módulo.
 */
import {
  EstadoFicha,
  Naturaleza,
  Nivel,
  Tema,
  type Almacen,
  type ConfiguracionApp,
  type FichaContenido,
  type Fragmento,
  type GestorFichas,
  type Guion,
  type PaqueteContenido,
} from '../dominio/modelo';
import { sha256Hex } from './hash';

export const CLAVE_FICHAS = 'fichas.v1';
const FORMATO_EXPORTACION = 'paramon-fichas';
const MAX_TEXTO = 1500;

interface EstadoGuardado {
  publicaciones: number;
  fichas: FichaContenido[];
}

export interface ControlFichas {
  gestor: GestorFichas;
  /** Paquete base + fichas aprobadas (lo que se busca y se cita). */
  paqueteActivo(): PaqueteContenido;
  /** "2024.1" → "2024.2" tras una publicación. */
  versionGuion(): string;
  /** Todas las fichas guardadas (borradores, aprobadas, retiradas), para el editor. */
  listar(): FichaContenido[];
}

const hoy = () => new Date().toISOString().slice(0, 10);

/** Sube el último número de la versión: ("2024.1", 2) → "2024.3"; sin número → "x.2". */
export function subirVersion(base: string, publicaciones: number): string {
  if (publicaciones <= 0) return base;
  const m = /^(.*?)(\d+)$/.exec(base);
  return m ? `${m[1]}${Number(m[2]) + publicaciones}` : `${base}.${publicaciones}`;
}

/** Guion "virtual" para las fichas cuya fuente es un documento (la cita muestra su nombre). */
const idDocumento = (documento: string) => `documento:${documento.trim()}`;

export function fichaAFragmento(ficha: FichaContenido): Fragmento {
  const fuente = ficha.fuente;
  return {
    id: `ficha-${ficha.id}`,
    guionId: 'guionId' in fuente ? fuente.guionId : idDocumento(fuente.documento),
    pagina: 'guionId' in fuente ? fuente.pagina : fuente.pagina ?? 0, // 0 = documento sin página
    estacionId: ficha.estacionId,
    tema: ficha.tema,
    naturaleza: ficha.naturaleza,
    nivel: Nivel.BREVE,
    titulo: ficha.titulo.trim(),
    texto: ficha.texto.trim(),
    palabrasClave: [],
    apto: ficha.tema !== Tema.SALUD_ALTURA,
    origen: 'ficha',
    fichaId: ficha.id,
  };
}

export function crearGestorFichas(deps: {
  paqueteBase: PaqueteContenido;
  config: ConfiguracionApp;
  almacen: Almacen;
  /** Se llama tras publicar, retirar o importar, con el paquete nuevo (para reindexar). */
  alCambiar: (paquete: PaqueteContenido) => void;
}): ControlFichas {
  const { paqueteBase, config, almacen } = deps;
  let desbloqueado = false;
  let estado = leer();
  let activo = construirActivo();

  function leer(): EstadoGuardado {
    try {
      const crudo = almacen.leer(CLAVE_FICHAS);
      const datos = crudo ? (JSON.parse(crudo) as EstadoGuardado) : null;
      if (datos && Array.isArray(datos.fichas)) {
        return { publicaciones: Number(datos.publicaciones) || 0, fichas: datos.fichas };
      }
    } catch { /* dato corrupto: se empieza de cero, el guion base sigue intacto */ }
    return { publicaciones: 0, fichas: [] };
  }

  function guardar(): void {
    almacen.escribir(CLAVE_FICHAS, JSON.stringify(estado));
  }

  function construirActivo(): PaqueteContenido {
    const aprobadas = estado.fichas.filter(f => f.estado === EstadoFicha.APROBADA);
    const reemplazados = new Set(aprobadas.flatMap(f => f.reemplazaFragmentoIds));
    const documentos: Guion[] = [...new Set(aprobadas.flatMap(f =>
      'documento' in f.fuente ? [f.fuente.documento.trim()] : []))]
      .map(d => ({ id: idDocumento(d), titulo: d, version: '', totalPaginas: 0, fechaVersion: '' }));
    return {
      ...paqueteBase,
      version: subirVersion(paqueteBase.version, estado.publicaciones),
      guiones: [...(paqueteBase.guiones ?? []), ...documentos],
      fragmentos: [
        ...(paqueteBase.fragmentos ?? []).filter(f => !reemplazados.has(f.id)),
        ...aprobadas.map(fichaAFragmento),
      ],
    };
  }

  function publicar(): void {
    estado.publicaciones += 1;
    guardar();
    activo = construirActivo();
    deps.alCambiar(activo);
  }

  function exigirDesbloqueo(): void {
    if (!desbloqueado) throw new Error('Primero ingresa la contraseña del editor.');
  }

  function buscarFicha(id: string): FichaContenido {
    const ficha = estado.fichas.find(f => f.id === id);
    if (!ficha) throw new Error('No se encontró esa ficha.');
    return ficha;
  }

  function reemplazar(ficha: FichaContenido): void {
    estado.fichas = [...estado.fichas.filter(f => f.id !== ficha.id), ficha];
  }

  function validar(ficha: FichaContenido): string[] {
    const errores: string[] = [];
    const vacio = (v: unknown) => typeof v !== 'string' || v.trim() === '';

    if (vacio(ficha?.id)) errores.push('Falta el identificador de la ficha.');
    if (vacio(ficha?.titulo)) errores.push('Falta el título.');
    if (vacio(ficha?.texto)) errores.push('Falta el texto.');
    else if (ficha.texto.trim().length > MAX_TEXTO) {
      errores.push(`El texto es muy largo: máximo ${MAX_TEXTO.toLocaleString('es-CO')} caracteres.`);
    }
    if (ficha?.estacionId != null && !paqueteBase.estaciones.some(e => e.id === ficha.estacionId)) {
      errores.push('La estación elegida no existe.');
    }
    if (!Object.values(Tema).includes(ficha?.tema)) errores.push('Elige un tema.');
    else if (ficha.tema === Tema.SALUD_ALTURA) {
      errores.push('El contenido de salud de altura no se puede editar desde aquí.');
    }
    if (!Object.values(Naturaleza).includes(ficha?.naturaleza)) errores.push('Elige el tipo de contenido.');

    const fuente = ficha?.fuente as FichaContenido['fuente'] | undefined;
    if (fuente && 'guionId' in fuente) {
      const guion = paqueteBase.guiones.find(g => g.id === fuente.guionId);
      if (!guion) errores.push('El guion indicado no existe.');
      else if (!Number.isInteger(fuente.pagina) || fuente.pagina < 1 || fuente.pagina > guion.totalPaginas) {
        errores.push(`La página debe estar entre 1 y ${guion.totalPaginas}.`);
      }
    } else if (fuente && 'documento' in fuente && !vacio(fuente.documento)) {
      if (fuente.pagina !== undefined && (!Number.isInteger(fuente.pagina) || fuente.pagina < 1)) {
        errores.push('La página del documento debe ser un número mayor que 0.');
      }
    } else {
      errores.push('Indica la página o el documento de donde sale.');
    }

    if (vacio(ficha?.aprobadaPor)) errores.push('Indica quién revisó la ficha (cargo).');
    for (const id of ficha?.reemplazaFragmentoIds ?? []) {
      if (!paqueteBase.fragmentos.some(f => f.id === id)) {
        errores.push(`El fragmento que quieres reemplazar no existe: ${id}.`);
      }
    }
    return errores;
  }

  const gestor: GestorFichas = {
    desbloquear(contrasena: string): boolean {
      const esperado = (config.pinAdministracion ?? '').trim().toLowerCase();
      desbloqueado = esperado.length > 0 && sha256Hex(contrasena ?? '') === esperado;
      return desbloqueado;
    },

    validar,

    async guardarBorrador(ficha: FichaContenido): Promise<void> {
      exigirDesbloqueo();
      const anterior = estado.fichas.find(f => f.id === ficha.id);
      reemplazar({
        ...ficha,
        reemplazaFragmentoIds: ficha.reemplazaFragmentoIds ?? [],
        estado: EstadoFicha.BORRADOR,
        version: anterior?.version ?? ficha.version ?? 0,
      });
      // Si estaba publicada, deja de estarlo hasta que se vuelva a publicar.
      if (anterior?.estado === EstadoFicha.APROBADA) publicar();
      else guardar();
    },

    async activar(fichaId: string): Promise<void> {
      exigirDesbloqueo();
      const ficha = buscarFicha(fichaId);
      const errores = validar(ficha);
      if (errores.length) throw new Error(errores.join('\n'));
      reemplazar({ ...ficha, estado: EstadoFicha.APROBADA, version: (ficha.version ?? 0) + 1, fechaRevision: hoy() });
      publicar();
    },

    async retirar(fichaId: string): Promise<void> {
      exigirDesbloqueo();
      const ficha = buscarFicha(fichaId);
      if (ficha.estado === EstadoFicha.RETIRADA) return;
      const estabaPublicada = ficha.estado === EstadoFicha.APROBADA;
      reemplazar({ ...ficha, estado: EstadoFicha.RETIRADA });
      if (estabaPublicada) publicar();
      else guardar();
    },

    async exportar(): Promise<string> {
      exigirDesbloqueo();
      return JSON.stringify({
        formato: FORMATO_EXPORTACION,
        version: 1,
        exportadoEn: hoy(),
        guion: activo.version,
        fichas: estado.fichas,
      }, null, 2);
    },

    async importar(contenido: string): Promise<FichaContenido[]> {
      exigirDesbloqueo();
      let fichas: FichaContenido[];
      try {
        const datos = JSON.parse(contenido);
        fichas = Array.isArray(datos) ? datos : datos?.formato === FORMATO_EXPORTACION ? datos.fichas : null;
        if (!Array.isArray(fichas)) throw new Error();
      } catch {
        throw new Error('El archivo no es un archivo de fichas válido.');
      }
      const conErrores = fichas
        .map(f => ({ f, errores: f.estado === EstadoFicha.RETIRADA ? [] : validar(f) }))
        .filter(x => x.errores.length > 0);
      if (conErrores.length) {
        throw new Error(conErrores
          .map(({ f, errores }) => `Ficha "${f?.titulo || f?.id || 'sin título'}": ${errores.join(' ')}`)
          .join('\n'));
      }
      fichas.forEach(reemplazar);
      publicar();
      return fichas;
    },
  };

  return {
    gestor,
    paqueteActivo: () => activo,
    versionGuion: () => activo.version,
    listar: () => [...estado.fichas],
  };
}
