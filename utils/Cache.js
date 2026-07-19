const NodeCache = require('node-cache');

const quoteCache = new NodeCache({ //in-memory cache
  stdTTL: 300,   //to temporarily store API responses for 5 minutes
  checkperiod: 60
});

module.exports = quoteCache;
