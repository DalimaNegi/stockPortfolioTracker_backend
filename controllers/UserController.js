const fmpService = require('../utils/FmpService');
const UserStock = require("../models/UserStock");
const UserWatchlist = require("../models/UserWatchlist");
const quoteCache = require("../utils/Cache");

const getUserStocks = async (req, res) => {
  try {
    const { email } = req.user;
    const stocksRes = await UserStock.findOne({ email });

    if (!stocksRes) {
      return res.status(404).json({ error: 'No Stock Found!!' });
    }

    const { stocks } = stocksRes;
    const quotes = {};
    const unfetchedSymbols = [];

    for (const { symbol } of stocks) {
      const cached = quoteCache.get(symbol);
      if (cached) {
        quotes[symbol] = cached;
      } else {
        unfetchedSymbols.push(symbol);
      }
    }

    if (unfetchedSymbols.length > 0) {
      const result = await fmpService.getQuote(unfetchedSymbols);

      for (const item of (result || [])) {
        quotes[item.symbol] = item;
        quoteCache.set(item.symbol, item);
      }
    }

    const holdings = stocks.map(({ symbol, quantity, buyPrice }) => {
      const quote = quotes[symbol];
      const price = quote?.price;
      const costBasis = quantity * buyPrice;
      const currentValue = typeof price === 'number' ? quantity * price : null;
      const pnl = currentValue !== null ? currentValue - costBasis : null;
      const pnlPercent = pnl !== null && costBasis !== 0 ? (pnl / costBasis) * 100 : null;

      return {
        name: quote?.name,
        symbol,
        price,
        open: quote?.open,
        low: quote?.dayLow,
        high: quote?.dayHigh,
        close: quote?.previousClose,
        quantity,
        buyPrice,
        costBasis,
        currentValue,
        pnl,
        pnlPercent
      };
    });

    res.json({ stocks: holdings });

  } catch (err) {
    console.error('Error fetching stocks:', err);
    return res.status(501).json({
      error: 'Server Error!!',
      details: err.message
    });
  }
};


const addUserStocks = async (req, res) => {
    try {
        const { email } = req.user
        const { stock, quantity, buyPrice } = req.body

        const qty = Number(quantity);
        const price = Number(buyPrice);

        if (!stock || !Number.isFinite(qty) || qty <= 0 || !Number.isFinite(price) || price <= 0) {
            return res.status(400).json({ error: 'Stock symbol, quantity and buy price are required' });
        }

        const stocksRes = await UserStock.findOne({ email })
        if (!stocksRes) {
            await UserStock.create({ email, stocks: [{ symbol: stock, quantity: qty, buyPrice: price }] })
            return res.status(200).json({ message: 'Stock Added SuccessFully' });
        }

        const existing = stocksRes.stocks.find(h => h.symbol === stock);
        if (existing) {
            const totalQty = existing.quantity + qty;
            existing.buyPrice = ((existing.quantity * existing.buyPrice) + (qty * price)) / totalQty;
            existing.quantity = totalQty;
        } else {
            stocksRes.stocks.push({ symbol: stock, quantity: qty, buyPrice: price });
        }

        await stocksRes.save();
        return res.status(200).json({ message: 'Stock Added SuccessFully' });
    } catch (err) {
        return res.status(501).json({ error: 'Server Error!!' });
    }
}

const getUserWatchlist = async (req, res) => {
  try {
    const { email } = req.user;
    const watchRes = await UserWatchlist.findOne({ email });

    if (!watchRes) {
      return res.status(404).json({ error: 'No Stock Found!!' });
    }

    const { stocks } = watchRes;
    const fetchedStocks = [];
    const unfetchedStocks = [];


    for (const symbol of stocks) {
      const cached = quoteCache.get(symbol);
      if (cached) {
        fetchedStocks.push({
          name: cached.name,
          open: cached.open,
          low: cached.dayLow,
          high: cached.dayHigh,
          symbol: cached.symbol,
          price: cached.price,
          change: cached.change,
          exchange: cached.exchange
        });
      } else {
        unfetchedStocks.push(symbol);
      }
    }


    if (unfetchedStocks.length > 0) {
      const result = await fmpService.getQuote(unfetchedStocks);

      for (const item of (result || [])) {
        fetchedStocks.push({
          name: item.name,
          open: item.open,
          low: item.dayLow,
          high: item.dayHigh,
          symbol: item.symbol,
          price: item.price,
          change: item.change,
          exchange: item.exchange
        });
        quoteCache.set(item.symbol, item);
      }
    }

    res.json({ stocks: fetchedStocks });

  } catch (err) {
    console.error('Error fetching watchlist:', err);
    return res.status(501).json({
      error: 'Server Error!!',
      details: err.message
    });
  }
};


const addUserWatchlist = async (req, res) => {
    try {
        const { email } = req.user
        const { stock } = req.body

        if (!stock) {
            return res.status(400).json({ error: 'Stock symbol is required' });
        }

        const watchRes = await UserWatchlist.findOne({ email })
        if (!watchRes) {
            await UserWatchlist.create({ email, stocks: [stock] })
            return res.status(200).json({ message: 'Stock Added SuccessFully' });
        } else {
            await UserWatchlist.updateOne(
                { email },
                { $addToSet: { stocks: stock } }
            );

            return res.status(200).json({ message: 'Stock Added SuccessFully' });
        }
    } catch (err) {
        return res.status(501).json({ error: 'Server Error!!' });
    }
}

module.exports = {
    getUserStocks,
    addUserStocks,
    getUserWatchlist,
    addUserWatchlist
}