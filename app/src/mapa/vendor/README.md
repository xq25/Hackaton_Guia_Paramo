# Librerías del mapa (incrustadas, sin CDN)

En el páramo no hay red: estas librerías se copian dentro del HTML del mapa.

| Archivo | Paquete | Licencia |
|---|---|---|
| leaflet.js, leaflet.css | leaflet@1.9.4 | BSD-2-Clause (LICENSE-leaflet) |
| protomaps-leaflet.js | protomaps-leaflet@5.1.0 | BSD-3-Clause (LICENSE-protomaps-leaflet) |
| pmtiles.js | pmtiles@4.5.0 | BSD-3-Clause |

Tras cambiar algo aquí o en `../mapa.html`, regenerar: `node src/mapa/construirHtml.js` (desde `app/`).
