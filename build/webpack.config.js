const path = require('path');

module.exports = {
  entry : path.join(__dirname, '../src/index.js'),
  output : {
    path : path.join(__dirname, '../dist'),
    filename : 'mock-http-client.js',
    libraryTarget : 'commonjs-module'
  }
};
