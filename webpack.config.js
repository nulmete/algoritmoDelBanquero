const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCSSExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
    entry: ['@babel/polyfill', './src/js/index.js'],
    output: {
        filename: 'js/bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
    // webpack-dev-server
    devServer: {
        contentBase: './dist'
    },
    plugins: [
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: './src/index.html'
        }),
        new MiniCSSExtractPlugin({
            filename: './css/style.css'
        }) 
    ],
    module: {
        rules: [
            {
                // test for all files with .js at the end
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader'
                }
            },
            {
                test: /\.scss$/,
                use: [
                    // Creates `style` nodes from JS strings
                    'style-loader',
                    // Extract CSS to a separate file
                    MiniCSSExtractPlugin.loader,
                    // Translates CSS into CommonJS
                    'css-loader',
                    // Autoprefixer
                    'postcss-loader',
                    // Compiles Sass to CSS
                    'sass-loader'
                ]
            }
        ]
    }
};