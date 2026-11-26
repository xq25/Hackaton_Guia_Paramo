# Dev B · Guía virtual (IA) + editor de fichas

El núcleo del reto (50 de 100 pts): responder **solo con el guion**, citar **guion y página**, y **abstenerse** cuando corresponde. Todo en TypeScript, casi todo probable sin celular.

Lee antes: [07-tareas.md](../07-tareas.md) (reglas del repo), [00-reto.md](../00-reto.md) (preguntas del jurado), [03-asistente.md](../03-asistente.md) (pipeline), [modelo.ts](../../app/src/dominio/modelo.ts) (secciones 1–5).

## Tus archivos

| Puedes crear y editar | No toques |
|---|---|
| `app/src/asistente/**` | Todo lo demás de `app/` |
| `app/src/pantallas/editor/**` | Navegación y menú (C monta tu pantalla) |
| | `pantallas/tema.ts` y `pantallas/comunes/**`: solo importarlos |

Si necesitas una dependencia nueva, pídesela a C. Ya vienen instaladas: `minisearch`, `llama.rn`, `@noble/hashes`, `jest`.

```
app/src/asistente/
  index.ts              ← ÚNICO archivo que importa C
  normalizador.ts
  reglas.ts             ReglaSeguridad[] (datos)
  filtroSeguridad.ts
  motorBusqueda.ts      MiniSearch
  evaluadorEvidencia.ts
  citas.ts
  prompt.ts
  motorModelo.ts        ÚNICO archivo que importa llama.rn
  orquestador.ts
  fichas.ts             GestorFichas
  __tests__/
    casos.ts            las 8 preguntas del jurado + las tuyas
    *.test.ts
    fixtures/contenido-mini.json
```

Ramas: `dev-b/<tarea>`.

## Lo que entregas (contrato con C)

`app/src/asistente/index.ts` exporta **solo esto**:

```ts
import type { PaqueteContenido, ConfiguracionApp, Almacen,
  OrquestadorRespuestas, GestorFichas, MotorModelo } from '../dominio/modelo';

export interface Asistente {
  orquestador: OrquestadorRespuestas;   // responder(texto, estacionId, nivel)
  fichas: GestorFichas;                 // al activar/retirar, reindexa solo
  versionGuion(): string;               // versión del paquete + fichas activas
  precargarModelo(): Promise<void>;     // C la llama al abrir el chat
  liberarModelo(): Promise<void>;       // C la llama al ir a segundo plano
}

export function crearAsistente(deps: {
  paquete: PaqueteContenido;
  config: ConfiguracionApp;
  almacen: Almacen;          // claves con prefijo 'fichas.'
  modelo?: MotorModelo;      // para tests; si falta, usa motorModelo.ts (llama.rn)
}): Asistente;
```

- `responder()` **nunca lanza**: ante cualquier error devuelve `RESPALDO_SIN_MODELO` o `ABSTENCION`.
- `Respuesta.citas` siempre armadas por `citas.ts` desde los fragmentos, nunca del texto del modelo.
- No dependes de la UI ni del MMKV real: todo llega inyectado.

Y `app/src/pantallas/editor/index.ts` exporta:

```ts
export function PantallaEditor(props: { asistente: Asistente; alCerrar: () => void }): JSX.Element;
```

C la abre desde el menú de perfil. La contraseña se pide **dentro** de tu pantalla.

## ⏸ Cuándo parar y esperar

| Antes de… | Espera a | Mientras tanto |
|---|---|---|
| Crear tu rama | **S0** (base en `main`) | Leer doc 00 y 03 |
| Correr `npx jest` | **S3** (C1a: Jest y dependencias en `package.json`) | Escribir B0 (solo tipos), el fixture y `casos.ts`, que no necesitan dependencias |
| Usar `minisearch` o `@noble/hashes` en código | **S3** | Escribir normalizador y reglas (TS puro) |
| Probar `llama.rn` en el celular (B4) | **S4** (C1b: la app nativa compila) + turno del celular con C | Escribir `prompt.ts` y `motorModelo.ts`, probados con el modelo falso |
| Calibrar con el contenido real (B5) | **S5** (A1: `contenido.json` real) | Calibrar con tu fixture |
| Cambiar la firma de `asistente/index.ts` | **OK de C** en el chat; C revisa el PR | Agregar lo nuevo sin quitar lo viejo |
| Agregar un campo a `modelo.ts` | **OK de A y C**; PR aparte, mergeado antes de usarlo | — |
| Necesitar otra dependencia | Pedírsela a C y esperar su merge | Seguir con otra parte |
| Dar estilo a la pantalla del editor (B7) | **S10** (C: `tema.ts` y `comunes/`) | Lógica del editor y formulario sin estilo |
| Cambiar las props de `PantallaEditor` | **OK de C** | — |
| Mergear algo después de la hora 5:15 | **S8**: solo arreglos que C apruebe | Medir tiempos para la ficha |

Si el `contenido.json` de A cambia ids y rompe tus tests, **no edites el JSON**: avísale a A o ajusta `casos.ts`.

## 📣 Cuándo avisar (otros esperan por ti)

| Al mergear | Escribe en el chat | Desbloquea a |
|---|---|---|
| B0 | "S1 mergeado: crearAsistente y PantallaEditor (stub) disponibles" | C (chat y menú) |
| B2, B3 | "asistente: pasan N/8 casos sin modelo" | Nadie espera; informa avance |
| B4 | "modelo responde en el celular en X s" | C (probar el chat real) |
| B7 | "editor de fichas mergeado, hagan pull" | C (sin espera) |
| B5 + B6 | "S7 mergeado" + **valores para `config.ts`** (`umbralEvidencia`, `maxFragmentos`, `maxTokens`, `timeoutModeloMs`, `rutaModelo`) | C (los pone en `config.ts` y verifica) |

Tú **no** editas `config.ts`: le pasas los valores a C.

## Tareas

### B0 · Stub de `index.ts` (primeros 20 min) — **bloqueante → S1**
`crearAsistente` con la firma de arriba, todo de mentira pero tipado:
- `orquestador.responder()` devuelve el primer fragmento de la estación como `RESPALDO_SIN_MODELO` con su cita.
- `fichas`: `desbloquear` compara contra `config.pinAdministracion` en texto plano, `validar` devuelve `[]`, el resto no hace nada.
- `versionGuion()` devuelve `paquete.version`; `precargarModelo`/`liberarModelo` resuelven al instante.
Solo importa tipos de `../dominio/modelo` (no necesita dependencias, así no esperas a S3). A partir de aquí **la firma no cambia** sin OK de C.
- `pantallas/editor/index.ts`: `PantallaEditor` que solo muestra "Editor en construcción" y un botón Cerrar.

### B1 · Casos de prueba + fixture
- `fixtures/contenido-mini.json`: `PaqueteContenido` escrito a mano con ~15 fragmentos reales (UTON pp. 5–10, p. 34; zona norte p. 1, p. 7), con su página.
- `casos.ts`: `{ pregunta, estacionId, esperado: { tipo, paginas?: number[], motivo? } }` para las 8 del doc 00 + variantes con errores de ortografía y sin tildes.
**Hecho cuando**: los tests corren (y fallan) con `npx jest src/asistente`.

### B2 · Normalizador + filtro de seguridad
- Normalizar: minúsculas, sin tildes, sin signos, sinónimos del paquete.
- `reglas.ts`: patrones para `EMERGENCIA`, `SALUD`, `INFORMACION_ACTUAL`, `ACTIVIDAD_RESTRINGIDA` (bañarse en laguna, salir del sendero, pisar dunas, subir al cráter), `FUERA_DE_TEMA`. Mensajes cortos, en español claro, siempre remitiendo al guía o al personal.
- Premisa falsa ("¿me puedo bañar en la laguna?"): corrige y remite; si hay fragmento `NORMA`, lo cita.
- Nunca generar indicaciones de seguridad propias: solo mensaje fijo o fragmento citado.
**Hecho cuando**: pasan los 4 casos de límites.

### B3 · Búsqueda, evidencia y citas
- MiniSearch sobre `titulo`, `texto`, `palabrasClave` (boost a título y palabras clave), búsqueda difusa y por prefijo; solo `apto: true`; impulso a `estacionId` actual.
- `EvaluadorEvidencia`: `suficiente` si el mejor puntaje supera `umbralEvidencia`; detecta `DiferenciaEntreFuentes` cuando los resultados tocan sus `fragmentoIds`.
- `citas.ts`: `Cita` desde el fragmento; advertencias por naturaleza ("Relato de tradición oral", "Dato de <fechaDato>").
**Hecho cuando**: los 4 casos de estación devuelven la página correcta (UTON p. 5, p. 7, p. 8; Kumanday con ambas fuentes) **sin modelo**.

### B4 · Prompt + modelo (en el celular)
- `prompt.ts`: sistema fijo ("Eres un guía del PNN Los Nevados. Responde en español sencillo, en máximo 3 frases, SOLO con la información de los fragmentos. Si no está, di que no lo sabes. No des indicaciones de seguridad ni de salud.") + fragmentos numerados + pregunta. `AMPLIADO` permite ~6 frases.
- `motorModelo.ts`: `llama.rn` con `config.rutaModelo` (Gemma 4 E2B GGUF Q4; respaldo Qwen3.5-0.8B), contexto 2048, `maxTokens`, temperatura baja (~0.2). Timeout → el orquestador responde `RESPALDO_SIN_MODELO` con el texto del fragmento.
- Poner el modelo en el celular: `adb push modelo.gguf /sdcard/Android/data/<paquete>/files/modelos/` (documentar ruta exacta con C).
**Hecho cuando**: la pregunta de Lunares se responde en el celular, con cita, dentro del timeout.

### B5 · Orquestador + calibración
- Flujo del doc 03: normalizar → filtro → buscar → evidencia → (diferencia | prompt + modelo) → citas → `Respuesta` con `tiempoMs`.
- Cambiar los tests a `app/assets/contenido.json` real (de A) y calibrar `umbralEvidencia`; proponer valores a C para `config.ts`.
- Medir: tiempo medio con y sin modelo (va en la ficha de una página).
**Hecho cuando**: los 8 casos pasan con el contenido real; tiempos anotados en `decisiones.md`.

### B6 · GestorFichas
`desbloquear` (sha256 de la contraseña vs `config.pinAdministracion`), `validar` (mensajes claros), `guardarBorrador`, `activar` (aplica `reemplazaFragmentoIds`, sube versión, reindexa), `retirar`, `exportar`/`importar` (JSON). Persistencia en `almacen` con clave `fichas.v1`.
**Hecho cuando**: test que activa una ficha y la siguiente consulta cita la ficha nueva.

### B7 · Pantalla del editor de fichas
Según doc 05: contraseña → lista de fragmentos por estación/tema (buscar por texto) → formulario de ficha (Título, Texto, Estación, Tipo en lenguaje llano, Fuente: guion + página o documento, Revisado por) → "Guardar borrador" / "Publicar" / "Retirar" → "Probar una pregunta" (usa `asistente.orquestador` y muestra la cita) → exportar/importar. Errores de `validar` en lenguaje claro junto al campo. Versión del guion visible arriba.
**Hecho cuando**: en el celular se publica una ficha y la siguiente pregunta cita la ficha nueva, sin reiniciar la app.

## Prioridad

B0 → B1 → B2 → B3 → B5 → B4 → B6 → B7. El editor nunca va antes que los 8 casos del jurado.

## Cómo pruebas

```powershell
cd app; npx jest src/asistente
```

Tests con `modelo` falso (`MotorModelo` que devuelve un texto fijo o tarda más del timeout). Nunca importar `llama.rn` en tests.
