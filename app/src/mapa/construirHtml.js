/**
 * Genera mapaHtml.generado.ts: mapa.html con Leaflet, pmtiles y protomaps-leaflet incrustados
 * (sin CDN: en el páramo no hay red). Uso, desde app/:  node src/mapa/construirHtml.js
 */
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const leer = (f) => fs.readFileSync(path.join(dir, f), 'utf8');
// Evita que un '</script>' dentro de una librería cierre la etiqueta antes de tiempo.
const seguro = (js) => js.replace(/<\/script/gi, '<\\/script');

const html = leer('mapa.html')
  .replace('/*__LEAFLET_CSS__*/', () => leer('vendor/leaflet.css'))
  .replace('/*__LEAFLET_JS__*/', () => seguro(leer('vendor/leaflet.js')))
  .replace('/*__PMTILES_JS__*/', () => seguro(leer('vendor/pmtiles.js')))
  .replace('/*__PROTOMAPS_JS__*/', () => seguro(leer('vendor/protomaps-leaflet.js')));

const salida =
  '/* eslint-disable */\n' +
  '// GENERADO por src/mapa/construirHtml.js a partir de mapa.html. No editar a mano.\n' +
  `export const MAPA_HTML: string = ${JSON.stringify(html)};\n`;

fs.writeFileSync(path.join(dir, 'mapaHtml.generado.ts'), salida, 'utf8');
console.log(`mapaHtml.generado.ts: ${(salida.length / 1024).toFixed(0)} KB`);
