'use strict';
const StockModel = require("../models").Stock;
const fetch = require('node-fetch');

// Create a new stock entry in the database
async function createStock(stock, like, ip) {
  const newStock = new StockModel({
    symbol: stock,
    likes: like ? [ip] : []
  });
  const savedNew = await newStock.save();
  return savedNew;
}

// Find an existing stock in the database
async function findStock(stock) {
  return await StockModel.findOne({ symbol: stock }).exec();
}

// Save or update stock in the database
async function saveStock(stock, like, ip) {
  let saved;
  const foundStock = await findStock(stock);
  if (!foundStock) {
    const createdStock = await createStock(stock, like, ip);
    saved = createdStock;
  } else {
    if (like && foundStock.likes.indexOf(ip) === -1) {
      foundStock.likes.push(ip);
    }
    saved = await foundStock.save();
  }
  return saved;
}

// Fetch stock data from the external API
async function getStock(stock) {
  try {
    const response = await fetch(
      `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock}/quote`
    );
    if (!response.ok) throw new Error("Failed to fetch stock data");
    const { symbol, latestPrice } = await response.json();
    return { symbol, latestPrice };
  } catch (err) {
    return { symbol: null, latestPrice: null };
  }
}

// Define API routes
module.exports = function (app) {
  app.route('/api/stock-prices')
    .get(async function (req, res) {
      const { stock, like } = req.query;

      // Handle multiple stocks (comparison mode)
      if (Array.isArray(stock)) {
        const stock1 = stock[0];
        const stock2 = stock[1];

        const { symbol: symbol1, latestPrice: price1 } = await getStock(stock1);
        const { symbol: symbol2, latestPrice: price2 } = await getStock(stock2);

        const firstStock = symbol1 ? await saveStock(stock1, like, req.ip) : { likes: [] };
        const secondStock = symbol2 ? await saveStock(stock2, like, req.ip) : { likes: [] };

        const relLikes1 = firstStock.likes.length - secondStock.likes.length;
        const relLikes2 = secondStock.likes.length - firstStock.likes.length;

        const stockData = [
          {
            stock: symbol1,
            price: price1,
            rel_likes: relLikes1,
          },
          {
            stock: symbol2,
            price: price2,
            rel_likes: relLikes2,
          }
        ];

        return res.json({ stockData });
      }

      // Handle single stock
      const { symbol, latestPrice } = await getStock(stock);
      if (!symbol) {
        return res.json({ stockData: { stock: null, likes: 0 } });
      }

      const savedStock = await saveStock(symbol, like, req.ip);

      return res.json({
        stockData: {
          stock: symbol,
          price: latestPrice,
          likes: savedStock.likes.length,
        }
      });
    });
};

