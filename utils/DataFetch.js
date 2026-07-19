const fmpService = require('./FmpService');

const getLast65DaysQueryOptions = () => {
    const today = new Date();
    const priorDate = new Date();
    priorDate.setDate(today.getDate() - 65);
    today.setDate(today.getDate()-1)

    const formatDate = (date) => {
        // Converts to YYYY-MM-DD
        return date.toISOString().split('T')[0];
    };

    return {
        from: formatDate(priorDate),
        to: formatDate(today)
    };
};

const getHistoricalData = async (symbol) => {
    try {

        const result = await fmpService.getHistorical(symbol, getLast65DaysQueryOptions());
        const data = {
            companySymbol: symbol,
            historicalData: result
        }

        return data


    } catch (error) {
        console.error('Error fetching historical data:', error);
    }
};

module.exports = getHistoricalData