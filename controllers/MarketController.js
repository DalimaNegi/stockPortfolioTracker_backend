// controllers/MarketController.js
const axios = require('axios');
const fmpService = require('../utils/FmpService');

const ts = () => new Date().toISOString().split('T')[1].replace('Z', '');
const log = (msg) => console.log(`[MarketController ${ts()}] ${msg}`);

const getLast30DaysQueryOptions = () => {
    const today = new Date();
    const priorDate = new Date();
    priorDate.setDate(today.getDate() - 90);
    today.setDate(today.getDate() - 1);

    const formatDate = (date) => {
        // Converts to YYYY-MM-DD
        return date.toISOString().split('T')[0];
    };

    return {
        period1: formatDate(priorDate),
        period2: formatDate(today),
        interval: '1d'
    };
};

const getStockInfoYahoo = async (req, res) => {
  const { symbol } = req.params;
  const requestStart = Date.now();
  log(`REQUEST START  GET /market/info/${symbol}`);

  if (!symbol) {
    log(`REQUEST FAILED GET /market/info — missing symbol`);
    return res.status(400).json({ error: 'Symbol is required' });
  }

  try {
    log(`  -> calling fmpService.getQuote(${symbol})`);
    const quoteRes = await fmpService.getQuote(symbol);
    const quote = quoteRes?.[0];

    if (!quote) {
      log(`REQUEST FAILED GET /market/info/${symbol} — 404 (${Date.now() - requestStart}ms) — no quote data from FMP`);
      return res.status(404).json({ error: `No data found for symbol ${symbol}` });
    }

    log(`  -> calling fmpService.getProfile(${symbol})`);
    const profileRes = await fmpService.getProfile(symbol);
    const profile = profileRes?.[0];

    // The quote endpoint carries no PE or dividend yield — those live in ratios-ttm.
    // Non-fatal if it fails; the page still renders with N/A for those two fields.
    let ratios = null;
    try {
      log(`  -> calling fmpService.getRatiosTTM(${symbol})`);
      const ratiosRes = await fmpService.getRatiosTTM(symbol);
      ratios = ratiosRes?.[0] || null;
    } catch (ratioErr) {
      log(`  -> ratios-ttm failed for ${symbol} (${ratioErr.message}) — continuing without PE/dividend`);
    }

    res.json({
      name: quote.name,
      symbol: quote.symbol,
      exchange: profile?.exchangeFullName || quote.exchange,
      sector: profile?.sector || 'N/A',
      industry: profile?.industry || 'N/A',
      MarketCapitalization: quote.marketCap,
      peRatio: ratios?.priceToEarningsRatioTTM,
      dividendYield: ratios?.dividendYieldTTM != null ? ratios.dividendYieldTTM * 100 : null,
      description: profile?.description,

      // Additional metrics
      open: quote.open,
      close: quote.previousClose,
      dayHigh: quote.dayHigh,
      dayLow: quote.dayLow,
      weekHigh: quote.yearHigh,
      weekLow: quote.yearLow,
      volume: quote.volume,
      percentChange: quote.changePercentage,
    });

    log(`REQUEST DONE   GET /market/info/${symbol} — 200 (${Date.now() - requestStart}ms)`);
  } catch (err) {
    const status = err.status === 402 ? 402 : 500;
    log(`REQUEST FAILED GET /market/info/${symbol} — ${status} (${Date.now() - requestStart}ms) — ${err.message}`);
    console.error('FMP error:', err.message);
    res.status(status).json({ error: status === 402 ? 'FMP plan limit exceeded.' : 'Server Error' });
  }
};

const chartPull = async (req, res) => {
  const { symbol } = req.body;
  const requestStart = Date.now();
  log(`REQUEST START  POST /market/chart — symbol=${symbol}`);

  try {
    const { period1, period2 } = getLast30DaysQueryOptions();

    log(`  -> calling fmpService.getQuote(${symbol})`);
    const quoteRes = await fmpService.getQuote(symbol);
    const quote = quoteRes?.[0];

    if (!quote) {
      log(`REQUEST FAILED POST /market/chart — symbol=${symbol} — 404 (${Date.now() - requestStart}ms) — no quote data from FMP`);
      return res.status(404).json({ error: `No data found for symbol ${symbol}` });
    }

    log(`  -> calling fmpService.getHistorical(${symbol})`);
    const historical = await fmpService.getHistorical(symbol, { from: period1, to: period2 });

    // FMP returns newest-first; the frontend expects oldest-first (it reads .at(-1) as "latest").
    const quotes = [...(historical || [])].sort((a, b) => new Date(a.date) - new Date(b.date));

    const chart = {
      quotes,
      meta: {
        longName: quote.name,
        symbol: quote.symbol,
        regularMarketPrice: quote.price,
        chartPreviousClose: quote.previousClose,
        regularMarketDayHigh: quote.dayHigh,
        regularMarketDayLow: quote.dayLow,
        regularMarketVolume: quote.volume,
        fiftyTwoWeekHigh: quote.yearHigh,
        fiftyTwoWeekLow: quote.yearLow,
      }
    };

    res.json({ chart });
    log(`REQUEST DONE   POST /market/chart — symbol=${symbol} — 200 (${Date.now() - requestStart}ms)`);
  } catch (err) {
    const status = err.status === 402 ? 402 : 500;
    log(`REQUEST FAILED POST /market/chart — symbol=${symbol} — ${status} (${Date.now() - requestStart}ms) — ${err.message}`);
    console.error('FMP chart error:', err.message);
    res.status(status).json({ error: status === 402 ? 'FMP plan limit exceeded.' : 'Server Error' });
  }
};

const financialData = async (req, res) => {
  const { symbol } = req.body;
  const requestStart = Date.now();
  log(`REQUEST START  POST /market/fininfo — symbol=${symbol}`);

  try {
    // Migrated to FMP's stable API — symbol is now a query param, not a path segment.
    // Free/current plan caps `limit` at 5, so both are capped here (was 6 and 8, which
    // triggered a 402 Payment Required).
    const ratiosAnnualUrl = `https://financialmodelingprep.com/stable/ratios?symbol=${symbol}&limit=5&apikey=${process.env.FMP_API_KEY}`;
    const incomeUrl = `https://financialmodelingprep.com/stable/income-statement?symbol=${symbol}&limit=5&apikey=${process.env.FMP_API_KEY}`;

    log(`  -> calling FMP ratios (${symbol})`);
    const ratioRes = await axios.get(ratiosAnnualUrl);
    log(`  -> calling FMP income-statement (${symbol})`);
    const incomeRes = await axios.get(incomeUrl);

    res.json({
      ratio: ratioRes.data,
      income: incomeRes.data
    });
    log(`REQUEST DONE   POST /market/fininfo — symbol=${symbol} — 200 (${Date.now() - requestStart}ms)`);
  } catch (err) {
    const status = err.response?.status;

    if (status === 402) {
      log(`REQUEST FAILED POST /market/fininfo — symbol=${symbol} — 402 (${Date.now() - requestStart}ms) — plan limit exceeded`);
      console.error('FMP plan limit exceeded:', err.response?.data);
      return res.status(402).json({
        error: 'FMP plan limit exceeded. Reduce the requested `limit` or upgrade your FMP plan.'
      });
    }

    log(`REQUEST FAILED POST /market/fininfo — symbol=${symbol} — ${status || 500} (${Date.now() - requestStart}ms) — ${err.message}`);
    console.error(err.response?.data);
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
};

module.exports = {
  getStockInfoYahoo,
  chartPull,
  financialData
};