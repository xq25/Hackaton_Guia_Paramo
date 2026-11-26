const { withDangerousMod, withGradleProperties } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Configura Android según el README de llama.rn y la guía C1b/C7:
 * 1. Compila únicamente para arm64-v8a (llama.rn solo distribuye binarios 64-bit y reduce el APK).
 * 2. Añade la regla ProGuard `-keep class com.rnllama.** { *; }` para el APK release.
 */
module.exports = function withAndroidArm64(config) {
  config = withGradleProperties(config, (c) => {
    c.modResults = c.modResults.filter(
      (item) => !(item.type === 'property' && item.key === 'reactNativeArchitectures')
    );
    c.modResults.push({
      type: 'property',
      key: 'reactNativeArchitectures',
      value: 'arm64-v8a',
    });
    return c;
  });

  config = withDangerousMod(config, [
    'android',
    async (c) => {
      const proguardPath = path.join(
        c.modRequest.platformProjectRoot,
        'app',
        'proguard-rules.pro'
      );
      if (fs.existsSync(proguardPath)) {
        const contenido = fs.readFileSync(proguardPath, 'utf8');
        if (!contenido.includes('com.rnllama')) {
          fs.writeFileSync(
            proguardPath,
            `${contenido.trimEnd()}\n\n# llama.rn\n-keep class com.rnllama.** { *; }\n`,
            'utf8'
          );
        }
      }
      return c;
    },
  ]);

  return config;
};
