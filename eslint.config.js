// https://docs.expo.dev/guides/using-eslint/
const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,
  {
    // Generado por prebuild o por herramientas: no es codigo nuestro.
    ignores: ['android/', 'ios/', 'dist/', 'node_modules/', '.expo/', 'docs/design/'],
  },
  {
    // El script de seed corre en Node, no en la app, y usa firebase-admin, que
    // se instala a mano con --no-save justo para no meterlo en el bundle
    // (ver cabecera del propio script). El resolver no puede encontrarlo.
    files: ['scripts/**/*.mjs'],
    rules: { 'import/no-unresolved': 'off' },
  },
];
