# paramON — Guía de páramo sin señal

App Android (APK) que acompaña la caminata Brisas → Valle de las Tumbas (PNN Los Nevados) **sin internet**. Tres piezas: un **guía virtual** que responde solo con el guion oficial, un **juego tipo Pokémon Go** (paradas físicas con NFC/QR, álbum de especies, insignias por visitas) y un **catálogo complementario** de flora y fauna (GBIF + fotos de iNaturalist).

Es un **prototipo de hackatón de 6 horas** (reto UTON, ver [docs/00-reto.md](docs/00-reto.md)): lo mínimo que funcione y se pueda demostrar. Nada de abstracciones "por si acaso". **Orden de trabajo** (D20): 1) datos (`contenido.json`, catálogo, mapa) → 2) asistente fiel al guion, con citas y abstenciones → 3) interfaz (mapa + panel + chat) → 4) juego. **NFC/QR y geocerca están pospuestos**; las llegadas se registran solo con modo demo. Se asume que el dispositivo de la demo cumple (D18).

## Reglas no negociables

1. **Offline primero.** En la caminata no hay red. Toda lectura sale del celular. La red solo se usa en el primer arranque ("Preparar salida") — ver [docs/02-datos-y-contenido.md](docs/02-datos-y-contenido.md).
2. **El guía virtual solo responde con el guion** (`contenido.json`). GBIF/iNaturalist **nunca** entran al prompt del modelo.
3. **Las citas (guion + página) las arma el sistema**, nunca el modelo.
4. **Filtro de seguridad antes de buscar y antes del modelo**: salud, emergencia, info actual (clima, alerta volcánica) y actividades restringidas no las responde el modelo.
5. **La información de seguridad nunca se bloquea**, ni por el juego ni por la geocerca.
6. **Especies CR/EN/VU nunca muestran ubicación** (`OCULTAR_UBICACION`).
7. **Anónimo**: sin cuentas, sin datos personales, visitas guardadas solo como día (`AAAA-MM-DD`), sin coordenadas.
8. **No inventar datos**: coordenadas de paradas, altitudes, nombres comunes. Si falta, va `null` y se anota en [docs/decisiones.md](docs/decisiones.md) como pendiente.
9. **Atribución obligatoria** de cada foto (autor, licencia, enlace). Solo licencias CC0 / CC BY / CC BY-NC.
10. **Geocerca presente pero desactivada** (`geocercaActiva = false`) hasta nuevo aviso. No borrar su lógica.
11. **Contenido oficial** (guiones UTON) solo para el reto. No publicarlo fuera del repo ni del APK.

## Stack

| Capa | Tecnología |
|---|---|
| App | React Native + TypeScript (Expo con prebuild), entregada como APK |
| Asistente | llama.rn + Gemma 4 E2B (respaldo Qwen3.5-0.8B) + MiniSearch + reglas de seguridad |
| Contenido | `contenido.json` generado con Python desde los dos guiones |
| Catálogo | GBIF (especies, amenaza UICN) + iNaturalist (fotos): semilla en el APK, se refresca en el primer arranque |
| Mapa precargado | Leaflet + `.pmtiles` de la zona dentro del APK; es la pantalla principal |
| Mapa | Leaflet en WebView + protomaps-leaflet + `.pmtiles` local |
| Llegada a paradas | react-native-nfc-manager (NFC/QR) + GPS de respaldo + modo demo |
| Progreso | MMKV, anónimo |
| Edición del guion | Editor dentro de la app con contraseña global → fichas en MMKV → "Publicar" reindexa al instante |

Fuera de alcance: Bluetooth, bitácora de fotos, voz, inglés.

## Estructura del repo

```
CLAUDE.md              este archivo (contexto general)
docs/                  decisiones de diseño — leer antes de implementar
app/                   app React Native (Expo)
  src/dominio/         modelo de clases y datos iniciales (modelo.ts = fuente de verdad)
  src/asistente/       orquestador, filtro, búsqueda, prompt, llama.rn
  src/juego/           registro NFC/GPS, progreso, insignias, retos, zona
  src/datos/           repositorio de contenido, sync GBIF/iNat, MMKV
  src/mapa/            WebView Leaflet + pmtiles
  assets/              contenido.json, mapa .pmtiles, imágenes de cartas
  src/pantallas/       UI (mapa principal + hojas encima, ver doc 06)
contenido/
  fuentes/             guiones UTON 2024 y zona norte en Markdown (con <!-- Página N -->)
  mapeo.yaml           página/sección → estación, tema, naturaleza; sinónimos; diferencias
  fichas/              fichas exportadas desde la app para integrar al siguiente APK
scripts/               Python: generar contenido.json, descargar GBIF, generar etiquetas NFC/QR
```

## Documentación

- [docs/00-reto.md](docs/00-reto.md) — requisitos del reto, preguntas del jurado, rúbrica, entregables
- [docs/01-arquitectura.md](docs/01-arquitectura.md) — capas, módulos y flujos principales
- [docs/02-datos-y-contenido.md](docs/02-datos-y-contenido.md) — guion → `contenido.json`, GBIF + iNaturalist, primer arranque
- [docs/03-asistente.md](docs/03-asistente.md) — pipeline de una pregunta y reglas de seguridad
- [docs/04-juego.md](docs/04-juego.md) — paradas NFC/GPS, visitas, insignias, álbum, retos, geocerca
- [docs/05-edicion-guion.md](docs/05-edicion-guion.md) — editor del guion en la app con contraseña
- [docs/06-interfaz.md](docs/06-interfaz.md) — pantallas según el boceto ([img/mockup-v1.jpg](docs/img/mockup-v1.jpg))
- [docs/07-tareas.md](docs/07-tareas.md) — reparto de tareas entre 3 desarrolladores e hitos
- [docs/decisiones.md](docs/decisiones.md) — registro de decisiones y pendientes
- [docs/referencia/](docs/referencia/) — ficha técnica y presentación del reto, exploración de la API de GBIF

## Trabajo en equipo (3 devs, un repo)

- Cada carpeta tiene **un solo dueño** (A datos + juego, B asistente + editor de fichas, C app + navegación). Antes de editar un archivo, revisa el mapa de propiedad en [docs/07-tareas.md](docs/07-tareas.md) y la guía del dev: [A](docs/tareas/dev-a-datos.md) · [B](docs/tareas/dev-b-asistente.md) · [C](docs/tareas/dev-c-app.md). Si el archivo no es del dev que pidió el trabajo, no lo toques: dilo.
- Entre devs solo se importan los `index.ts` de cada carpeta (`asistente/`, `pantallas/editor/`, `juego/`, `pantallas/juego/`). A y B reciben `PaqueteContenido`, `ConfiguracionApp` y `Almacen` inyectados por C, y solo importan de C `pantallas/tema.ts` y `pantallas/comunes/`.
- Antes de empezar algo que dependa de otro dev, revisa los puntos de sincronización (S0–S10) en [docs/07-tareas.md](docs/07-tareas.md): si el punto no está en `main`, no lo simules editando sus archivos.
- `modelo.ts`: solo cambios aditivos, en PR aparte.
- `package.json` es de C; `contenido.json` y `catalogo.json` solo los genera el script de A.

## Convenciones

- Nombres de dominio **en español**, igual que `app/src/dominio/modelo.ts`. Si el modelo cambia, se cambia ahí primero.
- TypeScript estricto. Componentes funcionales y hooks. Sin librería de estado global salvo que duela: React context + MMKV.
- Toda decisión nueva o cambio de alcance → una entrada corta en `docs/decisiones.md`.
- Textos de UI en español claro, pensados para visitantes, no para técnicos.
