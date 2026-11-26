# 05 · Edición del guion por el guía

Requisitos: el guía cambia lo que dice el guía virtual **sin saber programar y sin tocar código**, protegido con una **contraseña global**, y el cambio se "redespliega" en la app. El reto pide además que funcione **sin conexión** (ficha técnica, req. 4; presentación, diap. 19: "carga local → se activa una ficha versionada → una consulta verifica la cita").

## Decisión: editor dentro de la app (como en el boceto)

```
👤 → "Editar guion" → contraseña global
   ▼
Lista de estaciones y temas → elegir fragmento → "Editar" o "Agregar ficha"
   ▼
Formulario: Título · Texto · Estación · Tipo (Dato científico / Tradición oral / Norma / Seguridad)
            · Fuente (guion + página, o documento) · Revisado por (cargo)
   ▼
"Guardar borrador"  →  "Publicar"  (= redespliegue del guion en la app)
   ▼
La app guarda la ficha APROBADA, sube la versión del guion (p. ej. 2024.1 → 2024.2)
y reconstruye el índice de búsqueda en segundos, sin reiniciar.
   ▼
Pantalla de comprobación: "Prueba una pregunta" → muestra la respuesta con la nueva cita.
```

- Todo ocurre **offline**, en el celular. Es `GestorFichas` del modelo (`validar`, `activar`, `retirar`).
- La ficha **reemplaza** fragmentos (`reemplazaFragmentoIds`) o agrega uno nuevo. Nunca se borra el original: se puede **retirar** la ficha y volver al texto del guion.
- **Validación** con mensajes en lenguaje claro: "Falta el texto", "Indica la página o el documento de donde sale".
- **No editable** desde aquí: reglas de seguridad, contenido de salud de altura, configuración.
- La contraseña se guarda con hash (`pinAdministracion`). Una sola para todo el personal.

## Llevar los cambios a otros celulares

- **Exportar fichas** → archivo `fichas-AAAA-MM-DD.json` (compartir por cable, USB o cuando haya señal).
- **Importar fichas** en otro celular, con la misma contraseña.
- Para la siguiente versión del APK, el equipo copia ese archivo a `contenido/fichas/` y `generar_contenido.py` lo integra a `contenido.json`.

## Versión visible

Ajustes → "Versión del guion: 2024.2 · actualizado 26-11-2026". Así el guía confirma qué versión tiene cada celular.

## Descartado para el prototipo

Editor web (Decap CMS) + GitHub Actions que compila un APK por cada cambio: necesita internet y ~10 min de build, no se puede demostrar offline en el evento. Queda como evolución si UTON quiere un flujo central de aprobación.
