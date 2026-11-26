# 01 · Arquitectura

## Vista general

```
┌──────────────────────── Celular (sin red) ────────────────────────┐
│  Pantallas: Guía · Mapa · Álbum · Registro (NFC) · Seguridad      │
│        │            │          │           │                      │
│  OrquestadorRespuestas   MapaOffline   GestorProgreso  ServicioZona│
│   ├ FiltroSeguridad                     ├ ServicioRegistro (NFC/GPS/demo)
│   ├ MotorBusqueda (MiniSearch)          └ reglas de insignias      │
│   ├ ConstructorPrompt → MotorModelo (llama.rn)                    │
│   └ GeneradorCitas                                                │
│        │                                      │                   │
│  RepositorioContenido ◄── assets/contenido.json (va en el APK)    │
│  CatalogoEspecies     ◄── archivos descargados en primer arranque │
│  MMKV                 ◄── progreso anónimo                        │
└───────────────────────────────────────────────────────────────────┘
        ▲ solo en "Preparar salida" (con internet)
        │ GBIF API · iNaturalist API · descarga del modelo .gguf
```

## Qué viaja dónde

| Dato | Dónde vive | Cómo se actualiza |
|---|---|---|
| Guion (`contenido.json`) | Dentro del APK | Nuevo APK |
| Fichas editadas por el guía | MMKV | Editor en la app con contraseña (doc 05) |
| Imágenes de las 11 cartas del álbum | Dentro del APK | Nuevo APK |
| Mapa `.pmtiles` del recorrido | Dentro del APK | Nuevo APK |
| Modelo `.gguf` | Almacenamiento de la app | Primer arranque |
| Catálogo GBIF + fotos iNaturalist | Semilla dentro del APK + almacenamiento de la app | Primer arranque la refresca si hay red |
| Progreso (visitas, insignias, retos) | MMKV | Lo escribe la app |

El modelo **no** va dentro del APK: pesa del orden de GB y haría inmanejable la distribución y el build.

## Flujos principales

**1. Primer arranque ("Preparar salida")** — requiere internet, se hace antes de subir.
Descarga modelo → sincroniza GBIF → pide fotos a iNaturalist → guarda todo → marca `listo`. Si algo falla, la app funciona igual con lo que haya (el guía con respaldo sin modelo, el álbum con imágenes empaquetadas). Detalle en doc 02.

**2. Pregunta al guía** — `OrquestadorRespuestas.responder()`: normalizar → filtro de seguridad → buscar → evaluar evidencia → prompt → modelo (con timeout) → citas. Detalle en doc 03.

**3. Llegada a una parada** — toque NFC (o QR, o GPS dentro del radio, o demo con PIN) → verificar firma → `GestorProgreso.registrarVisita()` → cartas e insignias nuevas → pantalla de recompensa. Detalle en doc 04.

## Navegación

El mapa es la pantalla principal; panel de estación, guía (chat), fichas de especie y menú de perfil se abren encima. Detalle en [06-interfaz.md](06-interfaz.md).

## Para la demo del reto

El celular llega a la demo **ya preparado** (modelo y catálogo descargados antes). Durante la prueba no se descarga nada (regla del reto). Verificar con modo avión.

## Restricciones técnicas a vigilar

- **llama.rn** solo arm64; Gemma E2B pide un celular con ~6 GB de RAM. Si no carga o tarda, se usa Qwen o la respuesta `RESPALDO_SIN_MODELO`.
- **PMTiles en WebView**: `file://` no soporta lecturas por rango en todos los WebView. Plan: fuente personalizada de pmtiles que lea rangos del archivo vía puente RN; alternativa, servidor estático local.
- **Expo con prebuild**: llama.rn, nfc-manager y MMKV son módulos nativos → no hay Expo Go; se usa development build.
