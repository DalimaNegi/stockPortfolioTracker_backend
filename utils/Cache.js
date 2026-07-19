const NodeCache = require('node-cache');

const quoteCache = new NodeCache({
  stdTTL: 300,
  checkperiod: 60
});

module.exports = quoteCache;
