module.exports = {
  webpack: {
    configure: {
      optimization: {
        minimize: false,
        namedChunks: true,
        namedModules: true,
        mangleWasmImports: false,
      },
    },
  },
};
