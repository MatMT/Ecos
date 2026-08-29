const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add the .pte extension so Metro bundles the local AI model
config.resolver.assetExts.push('pte');

module.exports = config;
