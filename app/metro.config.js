const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Teselas vectoriales (.pmtiles) y ruta (.geojson) que entrega Dev A en assets/mapa/.
config.resolver.assetExts.push('pmtiles', 'geojson');

module.exports = config;
