# 03 · Asistente (guía virtual)

RAG local mínimo: buscar fragmentos del guion, y que el modelo **solo redacte** a partir de ellos.

## Pipeline de una pregunta

```
texto ─► NormalizadorConsulta (minúsculas, tildes, sinónimos)
      ─► FiltroSeguridad ──(coincide)──► Respuesta fija (+ cita de la norma si aplica)
      ─► MotorBusqueda (MiniSearch, prioriza estación actual)
      ─► EvaluadorEvidencia ──(insuficiente)──► ABSTENCION "No está en el guion, pregunta al personal"
      ─► ConstructorPrompt (instrucciones fijas + 2–3 fragmentos + pregunta)
      ─► MotorModelo.generar (timeout) ──(falla/tarda)──► RESPALDO_SIN_MODELO (fragmento tal cual)
      ─► GeneradorCitas (del fragmento, no del modelo)
      ─► Respuesta { tipo, texto, citas, advertencias, ampliable }
```

## Decisiones

- **MiniSearch** con campos `titulo`, `texto`, `palabrasClave`; boost por `estacionId` actual. Solo fragmentos con `apto=true`.
- **Umbral de evidencia** configurable (`ConfiguracionApp.umbralEvidencia`); se calibra con un set de 20–30 preguntas de prueba.
- **Prompt**: responder en español, máximo ~80 palabras en `BREVE`, solo con la información dada, decir "no lo sé" si no está. Sin pedirle citas: las ponemos nosotros.
- **Advertencias automáticas** por naturaleza del fragmento: `TRADICION_ORAL` → "Relato de tradición oral"; `DATO_FECHADO` → "Dato de <fecha>".
- **Diferencia entre fuentes** (p. ej. significado de Kumanday): se muestran ambas versiones con sus citas.
- **Modelo**: carga perezosa al abrir la pestaña Guía; se libera al salir a segundo plano. `maxTokens` ~200, `timeoutModeloMs` ~20 s (calibrar en el celular de demo).

## Reglas de seguridad (antes de todo)

| Motivo | Ejemplos de patrón | Respuesta |
|---|---|---|
| `EMERGENCIA` | "me perdí", "accidente", "auxilio" | Mensaje de emergencia + abrir pantalla Seguridad |
| `SALUD` | "mareo", "soroche", "pastilla", "me duele" | No da consejo médico; remite al personal/guía humano |
| `INFORMACION_ACTUAL` | "hoy", "clima", "alerta del volcán", "está abierto" | "No tengo datos en vivo; consulta al personal" |
| `ACTIVIDAD_RESTRINGIDA` | "bañarme en la laguna", "salir del sendero", "pisar dunas" | Norma + cita del guion |
| `FUERA_DE_TEMA` | otro parque, temas ajenos | Abstención amable |

Las reglas viven en `app/src/asistente/reglas.ts` como datos (`ReglaSeguridad[]`), fáciles de ampliar.

## Pruebas

El set de preguntas del jurado ([00-reto.md](00-reto.md)) se guarda como `app/src/asistente/__tests__/casos.ts` y se corre contra el orquestador sin modelo (búsqueda + reglas + citas). Cada caso fija `tipo` esperado y página citada.

## Modelo en el celular (B4)

`motorModelo.ts` carga con llama.rn el archivo de `CONFIG.rutaModelo` (contexto 2048, temperatura 0.2, CPU). Ruta acordada con C (`config.ts`):

```powershell
adb shell mkdir -p /sdcard/Android/data/co.uton.paramon/files/modelos
adb push modelo.gguf /sdcard/Android/data/co.uton.paramon/files/modelos/modelo.gguf
```

- El archivo se llama siempre `modelo.gguf` (Gemma 4 E2B Q4; si no cabe o es lento, Qwen3.5-0.8B con el mismo nombre).
- Desinstalar la app borra esa carpeta: hay que volver a copiarlo.
- Si el archivo no está o no carga, el chat igual funciona: responde con el texto del guion (`RESPALDO_SIN_MODELO`) y su cita.
- Para medir: la `Respuesta` trae `tiempoMs`. Anotar en `decisiones.md` la media con modelo (pregunta de Lunares) y sin modelo.

## Fuera del asistente

GBIF/iNaturalist no se indexan ni se pasan al modelo. Si el visitante pregunta por una especie que solo está en el catálogo, el asistente se abstiene y la UI puede sugerir "Ver en el álbum".
