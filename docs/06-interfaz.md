# 06 · Interfaz

Basada en el boceto del equipo: [img/mockup-v1.jpg](img/mockup-v1.jpg).

## Pantalla principal = el mapa

Una sola pantalla principal (sin pestañas). Todo se abre encima del mapa.

```
┌──────────────────────────────────────┐
│ ParamON                        (👤)  │ ← menú: Insignias · Editar guion (contraseña) · Créditos · Ajustes
│                                      │
│        📍 Valle de las Tumbas         │
│          ╲                           │
│   MAPA    📍 Lunares                  │ ← Leaflet offline, estaciones unidas por la ruta
│            ╲                         │   (pin gris = sin visitar, color = visitada)
│             📍 Arenales               │
│              ╲                       │
│               📍 Aguacerales          │
│                ╲ 📍 Brisas            │
│                                      │
│ [Registrar llegada]        [💬 Guía] │
└──────────────────────────────────────┘
```

## Panel de estación (al tocar un pin)

Hoja inferior deslizable (en el boceto está a la izquierda; en celular va abajo):

1. **Imagen de la estación**
2. **Nombre** + altitud + concepto central
3. **Dato curioso** — sale de la lista "Datos curiosos" del guion UTON (pp. 6, 7, 9, 10), con su cita
4. **Cuadrícula de fauna y flora "tipo Pokémon"** (3 × n): las especies de esa estación.
   - Desbloqueada → foto a color. Bloqueada → silueta gris + "Llega a la estación para descubrirla".
5. Botón **Preguntar al guía sobre esta estación** (abre el chat con la estación seleccionada y sus preguntas sugeridas).

## Ficha de especie (al tocar un cuadro)

Imagen grande · nombre común y científico · **características** (texto del guion con cita, si existe) · categoría UICN ("Fuente: GBIF") · crédito de la foto. Si la especie es CR/EN/VU, sin ubicación.

Qué especies van en cada estación: las de las tablas "Fauna/Plantas características" del guion UTON (pp. 5–10), cruzadas con el catálogo GBIF para la foto y la categoría. Las 6 cartas especiales del álbum (frailejón, pajonal, coral de páramo, cóndor, danta, periquito) aparecen aquí y en el álbum.

## Guía (chat)

Hoja inferior desde el botón 💬:
- Selector de estación arriba (o "Todo el recorrido").
- Botones de **preguntas sugeridas** de la estación.
- Respuesta breve → botón **"Contarme más"** (nivel ampliado).
- Debajo de cada respuesta, la **cita visible**: "Guion Ecoturístico UTON 2024 · p. 8 · Lunares". Advertencias en etiqueta ("Tradición oral", "Dato de 2022").
- Abstenciones con un estilo distinto (no parecen error): "Eso no está en el guion. Pregúntale a tu guía."

## Menú de perfil (👤)

- **Insignias**: cuadrícula bronce/plata/oro por estación + Explorador + Sabio.
- **Álbum**: las 11 cartas.
- **Editar guion** → pide contraseña global → editor de fichas (ver doc 05).
- **Créditos**: GBIF, iNaturalist, guiones UTON.
- **Ajustes**: versión del guion, modo demo (PIN), reiniciar progreso.

## Siempre visible

Botón **Seguridad** (números y protocolo de emergencia) — accesible desde cualquier estado, incluso con la geocerca bloqueando.

## Principios

Letra grande, alto contraste (sol fuerte en el páramo), botones grandes (guantes, frío), textos cortos. Todo en español.
