const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Los modelos TensorFlow Lite se resuelven como assets binarios para poder
// cargarlos con require() desde el detector de tiros.
config.resolver.assetExts.push('tflite');

module.exports = config;
