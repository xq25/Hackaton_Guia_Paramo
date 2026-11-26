# Dev A · Datos, contenido y juego

Conviertes los guiones, GBIF/iNaturalist y el mapa en archivos que la app lee sin internet. **Tu primera entrega desbloquea a B y a C.** Después construyes la capa de juego mínima (visitas en modo demo, insignias, álbum), que usa esos mismos datos.

Lee antes: [07-tareas.md](../07-tareas.md) (reglas del repo), [02-datos-y-contenido.md](../02-datos-y-contenido.md), [04-juego.md](../04-juego.md), [modelo.ts](../../app/src/dominio/modelo.ts) (`PaqueteContenido`, `Fragmento`, `EspecieCatalogo`, sección 6 de juego).

## Tus archivos

| Puedes crear y editar | No toques |
|---|---|
| `contenido/**` (menos `fuentes/`, que es solo lectura) | `app/src/**` |
| `scripts/**` (Python) | `app/package.json`, configuración de la app |
| `app/assets/contenido.json`, `catalogo.json` (solo vía script) | |
| `app/assets/mapa/**`, `app/assets/imagenes/**` | Navegación y menú de la app (C monta tus pantallas) |
| `app/src/juego/**` | `app/src/asistente/**`, `app/src/pantallas/editor/**` (B) |
| `app/src/pantallas/juego/**` | `pantallas/tema.ts` y `pantallas/comunes/**`: solo importarlos |

Ramas: `dev-a/<tarea>`. Python 3 + `scripts/requirements.txt` (`pyyaml`, `pillow`).

## Lo que entregas (contrato con B y C)

| Archivo | Forma | Lo usa |
|---|---|---|
| `app/assets/contenido.json` | `PaqueteContenido` exacto (UTF-8, ids estables, ordenado) | B (búsqueda), C (pantallas) |
| `app/assets/catalogo.json` | `EspecieCatalogo[]`; `foto` = nombre de archivo en `imagenes/especies/` | C |
| `app/assets/imagenes/estaciones/<estacionId>.webp` | 480 px | C |
| `app/assets/imagenes/especies/<slug>.webp` y `<slug>_mini.webp` | 480 px y 160 px | C |
| `app/assets/imagenes/indice.ts` | **Generado**: `export const IMAGENES: Record<string, number> = { 'especies/frailejon.webp': require('./especies/frailejon.webp'), ... }` (React Native no acepta `require` dinámico) | C |
| `app/assets/mapa/zona.pmtiles` | Teselas vectoriales de la zona | C |
| `app/assets/mapa/ruta.geojson` | `LineString` de la ruta + `Point` por estación con `{ estacionId, aproximada: true }` | C |
| `app/src/juego/index.ts` | `crearGestorProgreso({ paquete, almacen }): ProgresoJuego` (clave `progreso.v1`). `ProgresoJuego` = `GestorProgreso` + `paquete`, `coleccionables()`, `insignias()`, `fragmento(id)`, `fragmentosDeCarta(carta)`, `estacionVisitada(p, id)`, `especieDesbloqueada(p, nombreCientifico)` | C |
| `app/src/pantallas/juego/index.ts` | `PantallaInsignias` `{ progreso: ProgresoJuego; alCerrar }`, `PantallaAlbum` `{ progreso: ProgresoJuego; catalogo: EspecieCatalogo[]; alCerrar }`, `Recompensa` `{ resultado: ResultadoVisita; alCerrar }` (el resultado de `registrarVisita`) | C |

Reglas: nunca editar `contenido.json` a mano; si cambia, se regenera. Mantener los ids estables entre ejecuciones (B y los tests dependen de ellos).

## ⏸ Cuándo parar y esperar

| Antes de… | Espera a | Mientras tanto |
|---|---|---|
| Crear tu rama | **S0** (base en `main`) | Leer las guías y los guiones |
| Tocar algo dentro de `app/` que no sea `app/assets/` | **Nunca lo hagas**: pídeselo a C | — |
| Cambiar la forma de `contenido.json`, `catalogo.json`, `indice.ts` o las rutas de `app/assets/` | **OK de B y C** en el chat; ellos revisan el PR | Seguir con otra tarea de datos |
| Agregar un campo a `modelo.ts` | **OK de B y C**; PR aparte, mergeado antes de usar el campo | Generar el campo en el JSON sin usarlo todavía |
| Correr tests o pantallas de `juego/` | **S3** (C1a: dependencias y Jest) | Seguir con A1 |
| Dar estilo a `pantallas/juego/` (A6b) | **S10** (C: `tema.ts` y `comunes/`) | Lógica de `juego/` y pantallas sin estilo |
| Cambiar las props de tus pantallas o la firma de `crearGestorProgreso` | **OK de C** en el chat; C revisa el PR | Agregar sin quitar |
| Mergear algo después de la hora 5:15 | **S8**: solo arreglos que C apruebe | Ayudar con mediciones y la ficha de una página |

Tú no dependes de nadie para A1–A5: las fuentes ya están en el repo. **Prioridad**: A0 → A1 → A6a → A2/A4 → A3/A5/A6b. El juego nunca va antes que los datos.

## 📣 Cuándo avisar (otros esperan por ti)

| Al mergear | Escribe en el chat | Desbloquea a |
|---|---|---|
| A0 | "S2 mergeado" | C (`repositorio.ts`, panel de estación) |
| A1 | "S5 mergeado: contenido.json real, N fragmentos" | B (calibración B5) |
| A4 | "S6 mergeado: mapa y ruta" | C (cierre del mapa) |
| A6a | "S9 mergeado: gestor de progreso y pantallas de juego (stub)" | C (botón de llegada, especies bloqueadas, menú) |
| A6b | "juego real mergeado, hagan pull" | C (sin espera) |
| A2, A3, A5 | "contenido actualizado, hagan pull" | C y B (sin espera) |

Cada vez que regeneras `contenido.json`, menciona si cambió algún id de fragmento: los tests de B usan ids y páginas.

## Tareas

### A0 · Stubs (primeros 30 min) — **bloqueante → S2**
- `contenido.json` mínimo válido: los 2 `Guion`, las 5 `Estacion` de `ESTACIONES` en `modelo.ts` (con 2–3 `especies` cada una), 1 fragmento real por estación (copiado del guion con su página), listas vacías en el resto, `version: "0.0.1-stub"`.
- `catalogo.json` con 2–3 especies (frailejón, cóndor…) y `foto: null`.
- `imagenes/indice.ts` con `export const IMAGENES: Record<string, number> = {};` (o 1 imagen de prueba).
**Hecho cuando**: los tres archivos están en `main` y avisaste "S2 mergeado".

### A1 · `generar_contenido.py` + `mapeo.yaml` — **bloqueante para B5**
- Cortar `contenido/fuentes/*.md` por `<!-- Página N -->` y por encabezados `##`/`###`; párrafos largos en trozos de ~120 palabras.
- `mapeo.yaml`: metadatos de estaciones (copiar de `ESTACIONES`) y rangos de páginas → tema/estación/naturaleza (tabla en doc 02). Salud (UTON pp. 46–54) con `apto: false`. Descartar pp. 1–3 y 55–57 de UTON.
- `palabrasClave`: términos en negrita del texto + nombre de la estación + alias.
- Ids: `<guion>-p<página>-<n>` (p. ej. `uton2024-p8-2`).
- Validación: ids únicos, página dentro del rango del guion, enums válidos, ningún texto vacío. Si falla: mensaje claro y salida con código ≠ 0.
**Hecho cuando**: `python scripts/generar_contenido.py` genera el JSON sin errores y las páginas de las 4 preguntas de estación del doc 00 (UTON pp. 5, 7, 8 y 34) existen como fragmentos.

### A2 · Datos curiosos, especies, glosario, sinónimos, diferencias
- Datos curiosos (UTON pp. 6, 7, 9, 10) → fragmentos `uton2024-p<n>-dc<k>` y `Estacion.datosCuriososIds`. El "mito de la niña fantasma" (p. 7) → `TRADICION_ORAL`.
- Tablas de fauna/plantas de cada estación → `Estacion.especies` (nombres científicos). Tabla común → científico en `mapeo.yaml`; las dudosas con `validar: true` y anotadas en `decisiones.md`.
- Glosario (UTON pp. 11–13) → `TerminoGlosario[]`.
- `sinonimos`: piedras→rocas, hielo→glaciar, nieve→glaciar, volcán→Ruiz, frailejon→frailejón, Valle Lunar→Lunares, etc. (lista corta, ~20).
- `diferencias`: `kumanday` con fragmentos de zona norte p. 1 y UTON p. 34.
- Naturaleza: cifras con año → `DATO_FECHADO` + `fechaDato`; leyendas y Kumanday → `TRADICION_ORAL`; prohibiciones (dunas, sendero, ascenso) → `NORMA`.

### A3 · Catálogo semilla (GBIF + iNaturalist)
- `scripts/generar_catalogo.py` (parte del anexo de `docs/referencia/gbif-nevados.md`): especies de `Estacion.especies` + las 6 cartas + las ~25 más registradas por grupo en el sector norte.
- Por especie: `species/match` → `gbifKey`, `iucnRedListCategory`, nombre común en español.
- Foto: `api.inaturalist.org/v1/taxa?q=<nombre>` → `default_photo`. Solo CC0 / CC BY / CC BY-NC; si no, `foto: null`. Máx. 1 petición/s.
- Redimensionar a WebP 480 y 160 px con Pillow; generar `imagenes/indice.ts`.
- No guardar coordenadas de ocurrencias.

### A4 · Mapa
- `pmtiles extract` de una compilación de Protomaps con bbox del recorrido (aprox. lon −75.42 a −75.28, lat 4.85 a 4.96), `maxzoom` 15. Objetivo: < 30 MB.
- `ruta.geojson`: tomar de OpenStreetMap la vía/sendero Brisas → Valle de las Tumbas y la posición aproximada de cada estación. Todo con `aproximada: true`. **No** llenar `Estacion.ubicacion` (queda `null` hasta tener datos de UTON).
- Imágenes de estación: fotos con licencia libre o ilustración propia, con crédito en `catalogo.json` o en un `creditos.json` aparte.

### A5 · Retos y preguntas sugeridas
4 `RetoConocimiento` (Aguacerales, Arenales, Lunares, Valle de las Tumbas), 3 opciones, `fragmentoId` que respalda la correcta. 2–3 `preguntasSugeridas` por estación (incluir las del doc 00).

## Cómo pruebas

Preparar una vez el entorno de Python (los scripts usan `scripts/.venv`, ignorado por git):

```powershell
python -m venv scripts/.venv; scripts/.venv/Scripts/python -m pip install -r scripts/requirements.txt
```

Regenerar (en este orden; los dos últimos necesitan internet):

```powershell
scripts/.venv/Scripts/python scripts/generar_contenido.py
```
```powershell
scripts/.venv/Scripts/python scripts/generar_catalogo.py
```
```powershell
scripts/.venv/Scripts/python scripts/extraer_mapa.py
```

- Abrir el JSON y buscar a mano los fragmentos de las preguntas del jurado.
- Contar fragmentos por tema; ninguno de salud con `apto: true`.

## Tareas de juego

### A6a · Stubs de juego (hora 1:30) — **→ S9**
- `juego/index.ts`: `crearGestorProgreso` con la interfaz completa de `GestorProgreso`; guarda visitas en `almacen` (`progreso.v1`) pero aún sin insignias.
- `pantallas/juego/index.ts`: los 3 componentes exportados con sus props, mostrando solo un texto.
**Hecho cuando**: C puede importarlos y montarlos sin errores de tipos.

### A6b · Juego mínimo real
- `registrarVisita(estacionId, MetodoRegistro.DEMO)`: una por estación y día; recalcula `INSIGNIAS` (bronce/plata/oro, recorrido, sabio) y desbloquea `COLECCIONABLES_ESPECIE` y las especies de la estación; devuelve solo lo **nuevo**.
- `responderReto`: compara con `indiceCorrecta` de `paquete.retos`.
- `PantallaInsignias`: cuadrícula por estación (bronce/plata/oro) + Explorador + Sabio; bloqueadas en gris.
- `PantallaAlbum`: las 11 cartas (`imagenMini` vía `IMAGENES`), silueta si está bloqueada; al tocar, carta grande con texto y cita del fragmento.
- `Recompensa`: animación simple con lo desbloqueado.
- Tests de las reglas en `juego/__tests__/` (visita repetida el mismo día no suma; 5 visitas → oro).
**Hecho cuando**: con el botón de modo demo de C se gana una insignia y aparece la recompensa.
