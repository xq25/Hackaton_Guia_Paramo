# Dev C · App e interfaz

Eres el dueño del proyecto React Native: la base, el estilo común, el mapa, el chat, la navegación y el APK. Montas lo que entregan A (archivos en `assets/`, juego) y B (asistente, editor de fichas).

Lee antes: [07-tareas.md](../07-tareas.md) (reglas del repo), [06-interfaz.md](../06-interfaz.md) (pantallas y boceto), [01-arquitectura.md](../01-arquitectura.md), [modelo.ts](../../app/src/dominio/modelo.ts).

## Tus archivos

| Puedes crear y editar | No toques |
|---|---|
| `app/package.json`, lockfile, `app.json`, `tsconfig.json`, `jest.config.js`, `babel.config.js`, `android/` | `app/src/asistente/**` (B) |
| `app/App.tsx`, `app/src/config.ts` | `app/assets/**` (A) |
| `app/src/datos/**`, `app/src/mapa/**` | `contenido/`, `scripts/` (A) |
| `app/src/pantallas/**` **menos** `editor/` y `juego/` | `app/src/juego/**`, `app/src/pantallas/juego/**` (A) |
| `app/src/pantallas/tema.ts`, `app/src/pantallas/comunes/**` (A y B los importan) | `app/src/pantallas/editor/**` (B) |

**Importaciones permitidas de otros devs** (solo los `index.ts`):
- B: `crearAsistente` de `src/asistente`, `PantallaEditor` de `src/pantallas/editor`.
- A: `crearGestorProgreso` de `src/juego`, `PantallaInsignias`, `PantallaAlbum`, `Recompensa` de `src/pantallas/juego`; archivos de `app/assets/` (imágenes siempre vía `imagenes/indice.ts`).

Ramas: `dev-c/<tarea>`.

## Lo que entregas (contrato con B)

| Archivo | Exporta | Para |
|---|---|---|
| `app/src/datos/almacen.ts` | `almacen: Almacen` (MMKV) | Se inyecta en `crearAsistente` |
| `app/src/config.ts` | `CONFIG: ConfiguracionApp` con `geocercaActiva: false`, `alcanceRestriccion: APP_COMPLETA`, valores de B5 para umbral/tokens/timeout, `rutaModelo`, hashes de contraseña y PIN demo | B y la app |
| `app/src/datos/repositorio.ts` | `cargarPaquete(): PaqueteContenido`, `cargarCatalogo(): EspecieCatalogo[]` | La app y `crearAsistente` |
| Dependencias instaladas en C1a | ver abajo | Todos |
| `app/src/pantallas/tema.ts` + `pantallas/comunes/` | Colores, tipografía, tamaños; `Boton`, `Hoja` (hoja inferior), `Etiqueta` | A y B (estilo de sus pantallas) |

Un solo `Asistente` y un solo `GestorProgreso` para toda la app (créalos una vez en un contexto de React).

## ⏸ Cuándo parar y esperar

| Antes de… | Espera a | Mientras tanto |
|---|---|---|
| Crear tu rama | **S0** (base en `main`) | Leer doc 06 y el boceto |
| Escribir `repositorio.ts` (C1b) | **S2** (A0: stubs de `contenido.json`, `catalogo.json`, `indice.ts`) | Terminar C1a, `almacen.ts`, `config.ts` |
| Importar `crearAsistente` (C3) o montar `PantallaEditor` (C5) | **S1** (B0) | Maquetar el chat con datos escritos en el componente |
| Botón de llegada, especies bloqueadas (C4) y menú Insignias/Álbum (C5, C6) | **S9** (A6a: stubs de juego) | Mostrar todas las especies desbloqueadas temporalmente |
| Cerrar el mapa (C2) | **S6** (A4: `zona.pmtiles` + `ruta.geojson`) | Desarrollar con un `.pmtiles` de prueba local **sin commitearlo** (agregarlo a `.gitignore`) |
| Poner valores finales en `config.ts` y dar por cerrado C3 | **S7** (B5 + B6 + valores de B) | Usar valores provisionales |
| Cambiar `tema.ts` o `comunes/` de forma que rompa a A o B | **OK de A y B** | Agregar sin quitar |
| Generar el APK final (C7) | **S8** (congelamiento 5:15: todo mergeado) | Probar en modo avión lo que ya está en `main` |
| Cambiar `Almacen`, `config.ts` en lo que B usa, o cualquier contrato | **OK de B** en el chat | — |
| Agregar un campo a `modelo.ts` | **OK de A y B**; PR aparte | — |

Pedidos de dependencias de A o B: atiéndelos rápido, en un PR que solo toque `package.json` y el lockfile, y avisa al mergear.

## 📣 Cuándo avisar (otros esperan por ti)

| Al mergear | Escribe en el chat | Desbloquea a |
|---|---|---|
| C1a | "S3 mergeado: hagan npm install" | B (Jest), A si pidió algo |
| C1b | "S4 mergeado: app nativa compila" + cómo instalarla | B (modelo en el celular) |
| C1c | "S10 mergeado: tema y componentes comunes" | A (pantallas de juego), B (editor) |
| Cada dependencia pedida | "dependencia X mergeada" | Quien la pidió |
| Antes de C7 | "S8: congelamiento, solo arreglos" | Todos dejan de mergear funciones nuevas |

**Celular compartido**: tú decides cuándo se instala una versión nueva; B lo usa en bloques de 15 min para B4.

## Tareas

### C1a · Esqueleto + dependencias (primeros 20–30 min) — **bloqueante → S3**
- `app/` ya tiene `src/dominio/modelo.ts` (y quizá `src/asistente/` de B): crear el proyecto en una carpeta temporal (`npx create-expo-app@latest tmp --template blank-typescript`) y mover su contenido a `app/` **sin pisar `src/`**.
- Instalar **de una vez** (para que nadie más toque `package.json`):
  `expo-dev-client`, `react-native-mmkv`, `react-native-webview`, `expo-asset`, `expo-file-system`, `llama.rn`, `minisearch`, `@noble/hashes`, y de desarrollo `jest`, `jest-expo`, `@types/jest`.
  NFC (`react-native-nfc-manager`) **no** se instala aún (D20).
- `jest.config.js` con preset `jest-expo` y `testMatch: ['**/__tests__/**/*.test.ts']`.
- Sin pantallas todavía. **Hecho cuando**: `npm install` y `npx jest` corren en limpio; mergeado y avisado "S3 mergeado".

### C1b · App nativa en el celular — **bloqueante → S4**
- `npx expo prebuild` y `npx expo run:android` en el celular. Seguir el README de `llama.rn` para Android (arm64).
- `almacen.ts`, `config.ts`, `repositorio.ts` (lee `contenido.json` y `catalogo.json` con `import`).
**Hecho cuando**: la app abre en el celular y muestra el número de fragmentos del `contenido.json` stub de A.

### C1c · Estilo común (hora 1:30) — **→ S10**
`pantallas/tema.ts` (alto contraste, letra grande, botones grandes; doc 06) y `pantallas/comunes/` con `Boton`, `Hoja`, `Etiqueta`. Pocos y simples: A y B los usan para que todo se vea igual.

### C2 · Mapa principal
- `app/src/mapa/mapa.html` con **Leaflet y protomaps-leaflet incrustados** (sin CDN: en el páramo no hay red). Se carga en `react-native-webview`.
- `zona.pmtiles` de A: copiarlo de assets al almacenamiento de la app con `expo-asset` + `expo-file-system`; si el WebView no lee rangos de `file://`, pasar los bytes por `postMessage` con una fuente pmtiles personalizada (riesgo anotado en doc 01).
- Pines y ruta desde `ruta.geojson` (gris sin visitar, color visitada), con etiqueta "ubicación aproximada". Tocar un pin → abre el panel de estación.
**Hecho cuando**: el mapa se ve en modo avión.

### C3 · Chat del guía — **alta prioridad**
- Hoja inferior desde el botón 💬: selector de estación (o "Todo el recorrido"), botones de `preguntasSugeridas`, caja de texto, lista de mensajes.
- Cada respuesta: texto + **cita visible** ("Guion Ecoturístico UTON 2024 · p. 8 · Lunares") + etiquetas de `advertencias` + "Contarme más" si `ampliable` (vuelve a preguntar con `Nivel.AMPLIADO`).
- Abstenciones y remisiones con estilo propio (no rojo de error).
- Indicador "pensando…" mientras responde; `precargarModelo()` al abrir el chat y `liberarModelo()` al ir a segundo plano.
- Desde el minuto uno con el stub B0; no cambia nada cuando llegue la versión real.

### C4 · Panel de estación + ficha de especie
Según doc 06: imagen, nombre, altitud, concepto central, dato curioso (con cita), cuadrícula de especies (`Estacion.especies` ↔ `catalogo.json`) bloqueadas en silueta hasta la visita, botón "Preguntar al guía sobre esta estación". Ficha de especie: imagen, nombres, características, UICN ("Fuente: GBIF"), crédito de la foto.

### C5 · Menú de perfil
- Entradas: **Insignias** y **Álbum** (montan las pantallas de A), **Editar guion** (monta `<PantallaEditor asistente alCerrar />` de B; la contraseña la pide B), Seguridad, Créditos, Ajustes.
- **Seguridad** (accesible siempre, también desde la pantalla principal): por ahora "Avisa a tu guía o al personal del parque".
- **Créditos** (GBIF, iNaturalist, guiones UTON), **Ajustes** (versión del guion, "Restricción de zona: desactivada (modo pruebas)", modo demo con PIN, reiniciar progreso).

### C6 · Conectar el juego de A
- Botón **"Registrar llegada (demo)"** en el panel de estación, visible solo con modo demo activo (PIN en Ajustes): llama `progreso.registrarVisita(estacionId, MetodoRegistro.DEMO)` y muestra `<Recompensa>` de A.
- Pines del mapa y cuadrícula de especies leen visitas/desbloqueos de `progreso.cargar()`.
- La lógica y las pantallas del juego son de A; tú solo las conectas.

### C7 · APK final
`npx expo run:android --variant release` (o `./gradlew assembleRelease`). Probar todo en **modo avión** desde cero con el modelo ya copiado. Medir batería durante 15 min de uso (para la ficha de una página).

## Cómo pruebas

- Celular conectado con `npx expo run:android`.
- Antes de cada PR: modo avión y recorrer mapa → estación → chat.
