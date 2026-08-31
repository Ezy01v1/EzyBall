module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // El plugin de worklets debe ir SIEMPRE al final: lo requieren Reanimated 4
    // y los frame processors de react-native-vision-camera (Modulo 2).
    plugins: ['react-native-worklets/plugin'],
  };
};
