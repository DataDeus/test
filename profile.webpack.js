var webpack = require('webpack');

module.exports = {
  entry: './profile.js',
  mode: 'none',
  output: {
    filename: './public/javascripts/auth/profilebundle.js',
    path: __dirname,
  },
  watch: true,
  optimization: {
    minimize: true
  }
}