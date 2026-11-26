/** Jest para toda la app. Cada dev pone sus pruebas en `<su carpeta>/__tests__/*.test.ts`. */
module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/'],
  // Paquetes publicados solo como ESM (p. ej. @noble/hashes v2) deben pasar por Babel.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|react-native-.*|@noble/.*|minisearch|llama\\.rn))',
  ],
  passWithNoTests: true,
};
