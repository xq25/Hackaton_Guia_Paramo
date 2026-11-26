# 02 · Datos y contenido

Hay **dos fuentes separadas** y no se mezclan:

| | Guion | Catálogo complementario |
|---|---|---|
| Origen | Guion UTON 2024 (57 pp) + Guion zona norte (7 pp) | GBIF + iNaturalist |
| Lo usa | Guía virtual (asistente), cartas, retos | Álbum extendido, fichas de especie |
| Entra al prompt del modelo | Sí | **Nunca** |
| Se actualiza | Fichas en la app (doc 05) o nuevo APK | Primer arranque |

## Guion → `contenido.json`

```
contenido/fuentes/uton2024.md     guiones en Markdown, con marcas <!-- Página N -->
contenido/fuentes/zona_norte.md
contenido/mapeo.yaml              qué página/sección → estación, tema, naturaleza (lo escribimos a mano)
contenido/fichas/*.json           fichas exportadas desde la app (doc 05), opcional
        │  scripts/generar_contenido.py
        ▼
app/assets/contenido.json   → PaqueteContenido (modelo.ts)
```

- El script corta por las marcas `<!-- Página N -->` y por encabezados `##`/`###` → un `Fragmento` por sección y página (párrafos largos se parten en trozos de ~120 palabras).
- `mapeo.yaml` asigna estación, tema y naturaleza por rango de páginas (UTON: estaciones pp. 5–10, glosario 11–13, geología 15–28, glaciología 29–32, antropología 33–37, biología 38–43, clima 44–46, salud 46–54 con `apto=false`). Excepciones a mano: leyendas y Kumanday → `TRADICION_ORAL`; cifras con año → `DATO_FECHADO`.
- Los "Datos curiosos" de cada estación (UTON pp. 6, 7, 9, 10) se extraen como fragmentos propios: alimentan el panel de estación.
- Las tablas de cada estación (fauna/plantas características) generan la lista de especies por estación.
- Se descartan portada, agradecimientos y referencias (pp. 1–3, 55–57).
- El script valida (ids únicos, página existente, tema/naturaleza válidos) y falla si hay errores.
- Ids de fragmento: `<guion>-p<página>-<n>` (p. ej. `uton2024-p8-2`).
- Sinónimos y la diferencia Kumanday (zona norte p. 1 vs UTON p. 34) se escriben a mano en `mapeo.yaml`.

## Primer arranque: GBIF + iNaturalist

Pantalla **"Preparar salida"** (con internet, antes de la caminata). Pasos, cada uno reanudable:

1. **Modelo**: descarga el `.gguf` a almacenamiento de la app (con barra de progreso y verificación de tamaño/hash).
2. **GBIF — especies del sector norte**: `occurrence/search` con `facet=scientificName` en el recuadro norte (4.87–4.95 N, −75.39 a −75.31 O), separado por plantas (`kingdomKey=6`), aves (`classKey=212`) y mamíferos (`classKey=359`). Se guardan las ~25 más registradas de cada grupo.
3. **GBIF — ficha de cada especie**: `species/match` → `key`; `iucnRedListCategory`; `vernacularNames` (preferir español).
4. **iNaturalist — fotos**: `GET https://api.inaturalist.org/v1/taxa?q=<nombre científico>&rank=species` → `default_photo` (`medium_url`, `attribution`, `license_code`). Se **descarta** la foto si la licencia no es CC0 / CC BY / CC BY-NC. Se descarga la imagen al celular.
5. Guarda `catalogo.json` + imágenes y marca `catalogoListo`.

Reglas:
- Respetar los límites de iNaturalist: ~1 petición/segundo, cabecera `User-Agent` genérica de la app.
- **Nunca guardar coordenadas de especies CR/EN/VU**. Para el resto, el prototipo no guarda coordenadas de ocurrencias (no las necesitamos).
- Si no hay red o falla: la app arranca igual. El álbum principal (11 cartas) usa sus imágenes empaquetadas; el catálogo complementario muestra "Sin descargar".
- **Semilla empaquetada** (siempre): `scripts/generar_catalogo.py` genera `catalogo.json` + imágenes de las especies de las estaciones y las 6 cartas, y van dentro del APK. El reto prohíbe descargar durante la demo, así que la app debe verse completa sin el primer arranque.

### Forma del catálogo (en el celular)

`EspecieCatalogo` en `modelo.ts`: nombre científico, nombre común, grupo, categoría UICN, conteo de registros en el sector, foto local + `CreditoImagen`. Las 6 especies del álbum se enlazan por `nombreCientifico` para completar su `categoriaAmenaza` y `credito`.

## Licencias

- Dataset CARDER en GBIF: CC BY-NC 4.0 → citar en pantalla "Créditos".
- Fotos iNaturalist: crédito visible en cada carta/ficha (`autor`, `licencia`, enlace).
- Uso no comercial: compatible con el prototipo.
