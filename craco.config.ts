import { BundleAnalyzerPlugin } from "webpack-bundle-analyzer";
const BundleAnalyzerPlugin =
  require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

module.exports = function () {
  return {
    webpack: {
      plugins: process.env.ANALYZE === "true"
      ? [new BundleAnalyzerPlugin({ analyzerMode: "server" })]
      : [],    },
  };
};
