const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  // mode: 'development',
  entry: {
    main: "./src/index.js",
    //    telemetry: "./public/scripts/telemetry/index.js",
  },
  devtool: "cheap-module-source-map",
  module: {
    rules: [
      {
        test: /\.(js|mjs)$/,
        // Transpile app source plus the modern (ES2020+) PDF viewer packages,
        // which ship untranspiled syntax that webpack 4's parser cannot read.
        exclude: (modulePath) =>
          /node_modules/.test(modulePath) &&
          !/[\\/]node_modules[\\/](@cyntler[\\/]react-doc-viewer|react-pdf|pdfjs-dist)[\\/]/.test(modulePath),
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env", "@babel/preset-react"],
            plugins: [
              "@babel/plugin-proposal-optional-chaining",
              "@babel/plugin-proposal-nullish-coalescing-operator",
            ],
          },
        },
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  output: {
    filename: "[name]-[contenthash].bundle.js",
    path: path.resolve(__dirname, "build"),
    publicPath: "/ui/",
  },
  optimization: {
    splitChunks: {
      chunks: "all",
      minSize: 20000,
      maxSize: 50000,
      enforceSizeThreshold: 50000,
      minChunks: 1,
      maxAsyncRequests: 30,
      maxInitialRequests: 30,
    },
  },
  plugins: [
    new CleanWebpackPlugin(),
    // new BundleAnalyzerPlugin(),
    new HtmlWebpackPlugin({ inject: true, template: "public/index.html" }),
  ],
};
