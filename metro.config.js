const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// 1. Add 'tflite' (and 'bin' if needed) to the list of asset extensions
config.resolver.assetExts.push("tflite");
config.resolver.assetExts.push("bin"); 

module.exports = withNativeWind(config, { input: "./global.css" });