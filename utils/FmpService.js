// utils/FmpService.js
const axios = require('axios');
const NodeCache = require('node-cache');

const BASE_URL = 'https://financialmodelingprep.com/stable';

// TTL in seconds. FMP's free plan is capped at 250 requests/day total,
// so caching matters more here than it did for the old unofficial Yahoo scraper.
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

const ts = () => new Date().toISOString().split('T')[1].replace('Z', '');
const log = (msg) => console.log(`[fmpService ${ts()}] ${msg}`);

const getFromCacheOrFetch = async (cacheKey, fetchFn) => {
  const cached = cache.get(cacheKey);
  if (cached !== undefined) {
    log(`CACHE HIT  ${cacheKey}`);
    return cached;
  }
  log(`CACHE MISS ${cacheKey}`);

  const result = await fetchFn();
  cache.set(cacheKey, result);
  return result;
};

class FmpApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

const fmpGet = async (path, params) => {
  try {
    const { data } = await axios.get(`${BASE_URL}${path}`, {
      params: { ...params, apikey: process.env.FMP_API_KEY }
    });
    return data;
  } catch (err) {
    const status = err.response?.status;
    const message = err.response?.data?.['Error Message'] || err.message;
    log(`REQUEST FAILED ${path} — ${status || 'no status'} — ${message}`);
    throw new FmpApiError(message, status);
  }
};

const getQuoteSingle = (symbol) => {
  return getFromCacheOrFetch(`quote:${symbol}`, () => fmpGet('/quote', { symbol }));
};

// The free plan rejects comma-separated symbol batches with a 402 ("Premium Query
// Parameter"), so arrays are fetched one symbol at a time. Symbols the plan doesn't
// cover (e.g. .NS stocks, ^NSEI) also 402 — those are skipped so one locked symbol
// doesn't sink the rest of the list.
// Returns: single symbol -> FMP's raw response array; symbol array -> flat array of
// quote objects for the symbols that succeeded.
const getQuote = async (symbolOrSymbols) => {
  if (!Array.isArray(symbolOrSymbols)) return getQuoteSingle(symbolOrSymbols);

  const results = [];
  for (const symbol of symbolOrSymbols) {
    try {
      const res = await getQuoteSingle(symbol);
      if (res?.[0]) results.push(res[0]);
    } catch (err) {
      log(`SKIP ${symbol} — ${err.status || ''} ${err.message}`);
    }
  }
  return results;
};

const getProfile = (symbol) => {
  return getFromCacheOrFetch(`profile:${symbol}`, () => fmpGet('/profile', { symbol }));
};

const getRatiosTTM = (symbol) => {
  return getFromCacheOrFetch(`ratiosTTM:${symbol}`, () => fmpGet('/ratios-ttm', { symbol }));
};

const getHistorical = (symbol, { from, to }) => {
  return getFromCacheOrFetch(`historical:${symbol}:${from}:${to}`, () =>
    fmpGet('/historical-price-eod/full', { symbol, from, to })
  );
};

module.exports = {
  FmpApiError,
  getQuote,
  getProfile,
  getRatiosTTM,
  getHistorical,
};
