# Registro de decisiones

Formato: una línea de decisión + por qué. Las nuevas van al final; si una cambia, se marca ~~tachada~~ y se agrega la nueva.

| # | Fecha | Decisión | Por qué |
|---|---|---|---|
| D1 | 2026-11-26 | App en React Native + TS con **Expo (prebuild)**, entrega APK | Rapidez de arranque; los módulos nativos (llama.rn, NFC, MMKV) funcionan con development build |
| D2 | 2026-11-26 | **Guion y catálogo son fuentes separadas**; solo el guion alimenta al asistente | Respuestas verificables con cita; GBIF es complementario |
| D3 | 2026-11-26 | Catálogo GBIF + iNaturalist: **semilla dentro del APK** y el primer arranque la refresca si hay red | El reto prohíbe descargar durante la demo |
| D4 | 2026-11-26 | El **modelo .gguf se descarga** antes de usar la app, no va en el APK | Tamaño del APK y del build. En la demo el celular llega preparado |
| D5 | 2026-11-26 | Las 11 cartas del álbum llevan **imagen empaquetada** | El álbum funciona sin sincronizar |
| D6 | 2026-11-26 | Progreso y fichas en **MMKV** (no SQLite) | Objetos pequeños; más simple |
| D7 | 2026-11-26 | ~~Edición con Decap CMS + GitHub Actions → nuevo APK~~ | Reemplazada por D12 |
| D8 | 2026-11-26 | `generar_contenido.py` valida el guion al generar `contenido.json`; las fichas se validan en la app | Un guion inválido nunca llega a un celular |
| D9 | 2026-11-26 | Paradas con **NFC + QR** con la misma carga firmada (HMAC) | QR cubre celulares sin NFC; firma evita etiquetas falsas casuales |
| D10 | 2026-11-26 | `CreditoImagen.fuente` admite `'iNaturalist'` | Las fotos vienen de iNaturalist |
| D11 | 2026-11-26 | Bluetooth, bitácora de fotos, voz e inglés **fuera de alcance** | Prototipo de 6 horas |
| D12 | 2026-11-26 | **Edición del guion dentro de la app** con contraseña global: fichas → "Publicar" reindexa al instante; exportar/importar para otros celulares | Boceto del equipo + reto: offline y sin tocar código |
| D13 | 2026-11-26 | **Geocerca implementada pero desactivada** (`geocercaActiva = false`) | Pruebas y demo fuera del parque; queda lista para activar |
| D14 | 2026-11-26 | **El mapa es la pantalla principal**; todo lo demás se abre encima | Boceto del equipo |
| D15 | 2026-11-26 | Retos solo en las **4 estaciones interpretativas**; Brisas es introducción | Coincide con `sabio_paramo` (4) y con el reto ("4 estaciones") |
| D16 | 2026-11-26 | Fuente del pipeline: guiones en **Markdown con marcas de página** (`contenido/fuentes/`) | Ya vienen convertidos; la página sale de la marca, sin OCR |
| D17 | 2026-11-26 | Prioridad: asistente fiel + abstenciones + demo offline **antes** que el juego | 50 de 100 pts son fidelidad y seguridad |
| D18 | 2026-11-26 | Se **asume que el dispositivo de la demo cumple** (Android arm64, RAM suficiente). Un plan B de hardware se verá después, no ahora | Decisión del equipo |
| D19 | 2026-11-26 | El repo es **privado**; los guiones pueden vivir en `contenido/fuentes/` | Confirmado por el equipo |
| D20 | 2026-11-26 | **NFC/QR y geocerca se posponen**. Orden de trabajo: **1) datos** (`contenido.json`, catálogo, mapa) → **2) asistente** con base al guion → **3) interfaz** (mapa + panel + chat) → 4) juego. Mientras tanto, las llegadas se registran solo con el botón de **modo demo** | Equipo: priorizar datos y asistente |
| D21 | 2026-11-26 | **Rebalanceo**: A se queda con el juego (`juego/`, `pantallas/juego/`), B con la pantalla del editor de fichas (`pantallas/editor/`); C con base, estilo común, mapa, chat, navegación y APK | C era el cuello de botella; cada dev se queda con la UI de su propia lógica |

## Pendientes (no inventar: conseguir el dato)

- [ ] Coordenadas reales de las 5 estaciones y polígono de la zona (UTON o toma en campo). Sin ellas, el mapa usa posiciones aproximadas marcadas como tal.
- [ ] Protocolo y contactos de emergencia para la pantalla Seguridad (no están en los guiones). Mientras tanto: "Avisa a tu guía o al personal del parque".
- [ ] Texto y respuesta de los 4 retos, validados contra el guion.
- [ ] Medir en el celular de demo: tiempo de respuesta de Gemma E2B y consumo de batería (va en la ficha de una página).
- [ ] Nombres comunes de especies: validar los de `docs/referencia/gbif-nevados.md` §5.4.
- [ ] **Equivalencias común → científico** de las tablas de estación marcadas `validar: true` en `contenido/mapeo.yaml` (águila, conejo, cusumbo, pajonal, coral de páramo…): las propuso el equipo, no vienen del guion.
- [ ] Fecha del Guion turístico zona norte (el documento no la trae; va como "s.f.").
- [ ] Posición de **Aguacerales** y **Lunares**: no existen en OpenStreetMap. Brisas, Arenales y Valle de las Tumbas usan la posición de OSM (aproximada).
- [ ] Trazado real del sendero (track GPS de UTON u OSM vía Overpass desde otra red): hoy el mapa no dibuja línea de ruta.
- [ ] Fotos de las 5 estaciones (`app/assets/imagenes/estaciones/<id>.webp`), con crédito.
- [ ] Fotos con licencia válida para las especies que quedaron sin foto en `catalogo.json`.
