const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");

module.exports = {
  entry: './src/index.jsx', 
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js",  
    clean: true,
    publicPath: "/",
  },
  resolve: {
    extensions: [".js", ".jsx", ".json"],
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env", "@babel/preset-react"],
            plugins: [require.resolve("react-refresh/babel")],
          },
        },
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },

      {
        test: /\.js$/,
        enforce: 'pre',
        use: [
          {
            loader: 'source-map-loader',
            options: {
              filterSourceMappingUrl: (url, resourcePath) => {
                if (resourcePath.includes('react-axe')) {
                  return false; // Bỏ qua cảnh báo react-axe
                }
                return true;
              },
            },
          },
        ],
      },

      {
        test: /\.(glb|gltf)$/,
        type: 'asset/resource',  // Webpack 5
        generator: {
          filename: 'assets/[name][ext][query]'
        }
      }
    ],

  },
  ignoreWarnings: [
    {
      module: /react-axe/,
      message: /Failed to parse source map/,
    },
  ],

  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html', // file template HTML tương ứng
      filename: 'index.html',
      inject: 'body',
    }),
    new webpack.HotModuleReplacementPlugin(),
    new ReactRefreshWebpackPlugin(),
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "development"),
      "process.env.API_URL": JSON.stringify(process.env.API_URL || "http://localhost:8000/api"),
      "process.env.PUBLIC_URL": JSON.stringify(process.env.PUBLIC_URL || ""),
    }),
  ],
  devServer: {
    compress: true,
    allowedHosts: "all",
    static: {
      directory: path.resolve(__dirname, "public"),
      serveIndex: false,
    },
    port: 3000,
    hot: true,
    historyApiFallback: {
      index: "/robot.html",  // rewrite đơn giản cho SPA duy nhất
    },
  },
};
