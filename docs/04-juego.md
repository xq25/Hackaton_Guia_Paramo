# 04 · Capa de juego (tipo Pokémon Go)

> **Pospuesto (D20).** Primero datos y asistente. Mientras tanto, las llegadas se registran solo con **modo demo**; NFC, QR, GPS y geocerca se implementan después según este documento.

## Paradas físicas

Cada una de las 5 estaciones tiene una **etiqueta NFC** (principal) y un **QR impreso** con la misma carga (respaldo para celulares sin NFC).

Carga (`CargaNFC`, NDEF de texto / contenido del QR):

```json
{ "v": 1, "estacionId": "arenales", "tagId": "arenales-a", "firma": "<HMAC>" }
```

- `firma = HMAC-SHA256(estacionId + tagId, CLAVE_APP)` truncada. Se calcula con `@noble/hashes` (JS puro).
- La clave va dentro del APK: evita etiquetas falsas casuales, no a alguien que descompile la app. Suficiente para el prototipo.
- `scripts/generar_etiquetas.py` produce las cargas firmadas y los QR para imprimir.

## Registro de una llegada

Orden de intento: **NFC → QR → GPS → demo**.

- **GPS**: dentro de `radioDesbloqueoM` (80 m) de la estación, con precisión ≤ `precisionMaximaM` y ubicación no simulada. Requiere `ubicacion` real de la estación (pendiente).
- **Demo**: activado con `pinModoDemo` (guardado con hash). Las visitas `DEMO` se marcan y no cuentan en uso real.
- **Máximo una visita por estación y por día.** Repetir el mismo día no suma.

## Insignias

Ya definidas en `modelo.ts` (`INSIGNIAS`):

| Insignia | Criterio |
|---|---|
| `<estación>_1/2/3` — bronce / plata / oro | 1 / 3 / 5 visitas en días distintos a esa estación (oro = "maestro de la estación") |
| `recorrido_1` — Explorador del Kumanday | Las 5 estaciones visitadas el mismo día |
| `sabio_paramo` — Sabio del páramo | 4 retos correctos |

`GestorProgreso.registrarVisita()` recalcula insignias y coleccionables desbloqueados y devuelve los **nuevos** para mostrar la animación de recompensa.

## Álbum

- **11 cartas**: 5 de estación + 6 de especie (frailejón, pajonal, coral de páramo, cóndor, danta, periquito). Cada carta muestra texto del guion **con cita**, imagen y crédito.
- Requisitos de desbloqueo en `COLECCIONABLES_ESPECIE` (por visitas o por insignia).
- **Cuadrícula de especies por estación** (ver doc 06): especies de las tablas del guion de cada estación, bloqueadas (silueta) hasta registrar la visita.
- **Catálogo complementario** (GBIF + iNaturalist): resto de especies del sector norte, sin bloqueo, como "Pokédex extendida". Etiqueta "Fuente: GBIF / foto iNaturalist".

## Retos

Una pregunta de opción múltiple en cada una de las **4 estaciones interpretativas** (Aguacerales, Arenales, Lunares, Valle de las Tumbas; Brisas es la introducción y no tiene reto). Por eso `sabio_paramo` pide 4. Se habilita después de registrar la visita. La respuesta correcta está en un fragmento del guion; al responder se muestra esa cita.

## Geocerca (implementada, **desactivada por ahora**)

`ServicioZona` con el polígono del recorrido. Comportamiento final decidido: `APP_COMPLETA` (fuera de la zona solo se ve bloqueo + Seguridad).

- Se implementa completa (polígono, precisión, detección de GPS simulado, pantalla de bloqueo).
- Se controla con `ConfiguracionApp.geocercaActiva`, que **arranca en `false`** para pruebas y para la demo fuera del parque. Con `false`, `ServicioZona.permitido()` siempre devuelve `true` y no se pide GPS para eso.
- Ajustes muestra "Restricción de zona: desactivada (modo pruebas)" para que sea visible.
- Para activarla en campo: cambiar el valor en `app/src/config.ts` y generar APK. Si el GPS falla en campo, pasar a `SOLO_JUEGO`.

## Persistencia (MMKV)

Una clave `progreso` con `ProgresoLocal` en JSON. Sin cuenta, sin hora exacta, sin coordenadas. Botón "Reiniciar progreso" en ajustes.
