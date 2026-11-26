/** Jest para toda la app. Cada dev pone sus pruebas en `<su carpeta>/__tests__/*.test.ts`. */
module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/'],
  passWithNoTests: true,
};
