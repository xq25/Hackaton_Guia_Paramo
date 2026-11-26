# 07 · Reparto de tareas (3 desarrolladores)

Orden de prioridad (D20): **datos → asistente → interfaz → juego**. Pospuesto: NFC/QR, geocerca y sincronización en vivo con GBIF (se usa la semilla).

Guía de cada dev (léela completa antes de empezar):

- [tareas/dev-a-datos.md](tareas/dev-a-datos.md) — Datos, contenido y juego
- [tareas/dev-b-asistente.md](tareas/dev-b-asistente.md) — Guía virtual (IA) + editor de fichas
- [tareas/dev-c-app.md](tareas/dev-c-app.md) — App e interfaz

## Mapa de propiedad de archivos

Cada ruta tiene **un solo dueño**. Solo el dueño la crea, edita o borra.

```
paramON/
├─ CLAUDE.md, docs/                      TODOS (cambios pequeños, avisar en el chat)
├─ contenido/                            A
├─ scripts/                              A
└─ app/
   ├─ package.json, package-lock.json    C   (B y A piden dependencias a C)
   ├─ app.json, tsconfig.json, jest.config.js, babel.config.js, android/   C
   ├─ App.tsx                            C
   ├─ assets/
   │  ├─ contenido.json                  A   (lo genera el script, nunca a mano)
   │  ├─ catalogo.json                   A
   │  ├─ mapa/                           A   (.pmtiles)
   │  └─ imagenes/                       A
   └─ src/
      ├─ dominio/modelo.ts               COMPARTIDO — ver regla 2
      ├─ config.ts                       C
      ├─ asistente/                      B   (incluye __tests__/)
      ├─ datos/                          C   (repositorio, almacen MMKV)
      ├─ mapa/                           C
      ├─ juego/                          A   (GestorProgreso, reglas de insignias)
      └─ pantallas/
         ├─ tema.ts, comunes/            C   (A y B solo los importan)
         ├─ editor/                      B   (editor de fichas)
         ├─ juego/                       A   (insignias, álbum, recompensa)
         └─ (todo lo demás)              C   (mapa, panel, chat, menú, seguridad, ajustes)
```

## Reglas del repo

1. **Ramas por dev**: `dev-a/<tarea>`, `dev-b/<tarea>`, `dev-c/<tarea>` (p. ej. `dev-b/filtro-seguridad`). PR pequeños a `main`, cada hora como mínimo. `git pull --rebase origin main` antes de abrir PR.
2. **`modelo.ts` está congelado.** Solo se aceptan cambios **aditivos** (campos opcionales, tipos nuevos) en un PR propio de una sola línea de propósito, avisando a los otros dos. Nunca renombrar ni borrar.
3. **Nadie importa archivos de la carpeta de otro dev**, salvo los puntos de entrada de la tabla de abajo. Excepción: A y B pueden importar (sin editar) `pantallas/tema.ts` y `pantallas/comunes/**` de C para que todo se vea igual.
4. **Dependencias**: C las instala todas en C1a (lista en su guía). Si alguien necesita otra, se la pide a C; así `package-lock.json` tiene un solo autor.
5. **Archivos generados** (`contenido.json`, `catalogo.json`) solo los escribe el script de A. Si hay conflicto, se regenera, no se resuelve a mano.
6. Commits en español, en presente: `asistente: agrega reglas de salud`.

## Contratos de integración

| De → a | Punto de entrada | Forma |
|---|---|---|
| A → B, C | `app/assets/contenido.json` | `PaqueteContenido` (`modelo.ts`) |
| A → C | `app/assets/catalogo.json`, `app/assets/mapa/zona.pmtiles`, `app/assets/imagenes/**` | `EspecieCatalogo[]`; rutas fijas (guía de A) |
| B → C | `app/src/asistente/index.ts` | `crearAsistente()` (guía de B) |
| B → C | `app/src/pantallas/editor/index.ts` | `<PantallaEditor asistente alCerrar />` |
| A → C | `app/src/juego/index.ts` | `crearGestorProgreso()` → `GestorProgreso` (guía de A) |
| A → C | `app/src/pantallas/juego/index.ts` | `<PantallaInsignias>`, `<PantallaAlbum>`, `<Recompensa>` (guía de A) |
| C → A, B | Inyección: C pasa `PaqueteContenido`, `ConfiguracionApp`, `Almacen`, `EspecieCatalogo[]` | Interfaces en `modelo.ts` |
| C → A, B | `app/src/pantallas/tema.ts`, `pantallas/comunes/**` | Colores, tipografía, `Boton`, `Hoja` (solo lectura) |

C monta las pantallas de A y B en su navegación y menú; A y B no tocan la navegación.

Para no bloquearse, cada uno sube primero una versión mínima de lo que los otros consumen:
- **A0** (30 min): `contenido.json`, `catalogo.json` e `imagenes/indice.ts` mínimos pero válidos.
- **B0** (20 min): `asistente/index.ts` con `crearAsistente` completo en firma: `orquestador` y `fichas` de mentira. C conecta la UI desde el principio y el cambio a la versión real no le toca ni una línea.
- **C1a** (20–30 min): proyecto Expo con **todas** las dependencias y Jest configurado, sin pantallas.
- **B** prueba con su propio fixture (`asistente/__tests__/fixtures/`), no con el `contenido.json` de A, hasta B5.

## Puntos de sincronización

Son los **únicos** momentos en que alguien debe parar y esperar a otro. Cada guía de dev los repite en su sección "⏸ Cuándo parar".

| Id | Qué se mergea a `main` | Quién lo sube | Quién espera | Qué desbloquea |
|---|---|---|---|---|
| **S0** | Esta base (CLAUDE.md, docs, `modelo.ts`, fuentes) | Líder | **Todos** | Crear las ramas |
| **S1** | B0: `asistente/index.ts` + `pantallas/editor/index.ts` stubs | B | C | C3 importa `crearAsistente`; C5 monta `PantallaEditor` |
| **S2** | A0: stubs de `contenido.json`, `catalogo.json`, `indice.ts` | A | C | `repositorio.ts` (C1b) y C4 |
| **S3** | C1a: `package.json` + dependencias + Jest | C | B (y A si necesita algo en `app/`) | B puede correr `npx jest` |
| **S4** | C1b: app nativa compila con `llama.rn` en el celular | C | B | B4 (modelo en el celular) |
| **S5** | A1: `contenido.json` real | A | B | B5 (calibrar con contenido real) |
| **S6** | A4: `zona.pmtiles` + `ruta.geojson` | A | C | Cerrar C2 (antes C usa un `.pmtiles` de prueba local, sin commitear) |
| **S7** | B5 + B6: orquestador y fichas reales + valores para `config.ts` | B | C | C pone los valores en `config.ts` y verifica C3 |
| **S9** | A6a: `juego/index.ts` + `pantallas/juego/index.ts` stubs | A | C | Botón "Registrar llegada (demo)", estado bloqueado en C4, menú Insignias/Álbum |
| **S10** | C1b + tema: `pantallas/tema.ts` y `pantallas/comunes/` | C | A (A6b), B (B7) | Pantallas de juego y editor con el mismo estilo |
| **S8** | **Congelamiento** (hora 5:15): todo mergeado, solo arreglos | Todos | C | C7: APK final |

Sin punto de sincronización (no hay que esperar, solo `git pull --rebase` cuando llegue): A2, A3, A5, B1–B3, C2–C4 contra los stubs.

### Reglas al cruzar un punto

- **Quien sube** el PR de un S-punto lo mergea apenas pase su prueba y **avisa en el chat del equipo**: "S2 mergeado".
- **Quien espera** hace `git pull --rebase origin main` y sigue. Mientras espera, avanza en tareas sin dependencia (cada guía dice cuáles).
- **Cambios de contrato** (firma de `asistente/index.ts`, forma de `contenido.json`/`catalogo.json`, rutas de `assets/`, `modelo.ts`): **parar**, proponer en el chat y esperar el OK del dev que lo consume **antes** de mergear. El consumidor revisa ese PR.
- **Un solo celular de pruebas**: B4 y C se turnan. Para cargar una versión nueva de la app manda C; B usa el celular en bloques de 15 min.

## Hitos

| Hora | A | B | C |
|---|---|---|---|
| 0:30 | A0 → **S2** | B0 → **S1** | C1a → **S3** |
| 1 | A1 → **S5** | B1 casos de prueba | C1b → **S4** |
| 1:30 | A6a → **S9** | | tema + comunes → **S10** |
| 3 | A2 + A4 → **S6** | B2 + B3 pasan los 8 casos sin modelo | C2 mapa + C3 chat |
| 5 | A3 + A5 + A6b | B4, B5 + B6 → **S7**, B7 | C4 + C5 |
| 5:15 | **S8 congelamiento** | | |
| 6 | Todos: APK en modo avión (C7), mediciones, ficha de una página, pitch | | |
