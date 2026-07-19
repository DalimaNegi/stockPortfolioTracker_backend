const cron = require('node-cron');
const fmpService = require('../utils/FmpService');

let cache = [];
let indices = [ "^GSPC", "^N225", "^HSI","^NDX"]

const fetchIndices = async () => {
  try {
    const results = await fmpService.getQuote(indices);
    cache = (results || []).map((data) => ({
      name: data.name,
      price: data.price,
      change: data.change,
      changePercent: data.changePercentage
    }));
    console.log(`[${new Date().toLocaleTimeString()}] Cache updated (${cache.length}/${indices.length} indices returned by FMP)`);
  } catch (err) {
    console.error('Error fetching indices:', err.message);
  }
};
if (process.env.KILL_SWITCH == 0) {

  fetchIndices()

  // every 10 minutes
  cron.schedule('*/10 * * * *', fetchIndices);
} else {
  cache.push(
    {
      name: "Nifty",
      price: 5455,
      change: 50,
      changePercent: 25
    }
  )
}

module.exports = {
  getCachedIndices: () => cache
};
