const { getCachedIndices } = require('../jobs/fetchIndex');
const getHistoricalData = require('../utils/DataFetch');

const indexFetch = async (req, res) => {
  const data = getCachedIndices();
  if (data.length === 0) {
    return res.status(503).json({ message: 'Data not available yet' });
  }

  res.json({
    time: new Date().toISOString(),
    indices: data
  });

}


module.exports = {indexFetch}