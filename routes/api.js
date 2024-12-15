'use strict';
const StockModel = require("../models").Stock;
const fetch = require('node-fetch');

// create stock
async function createStock(stock, like, ip) {
  const newStock = new StockModel({
    symbol: stock,
    likes: like ? [ip] : [] // If like is true, store the IP
  });
  const savedNew = await newStock.save();
  return savedNew;
}

// find stock
async function findStock(stock) {
  return await StockModel.findOne({
    symbol: stock
  }).exec();
}

// save stock
async function saveStock(stock, like, ip) {
  let saved = {};
  const foundStock = await findStock(stock);
  if (!foundStock) {
    const createsaved = await createStock(stock, like, ip);
    saved = createsaved;
    return saved;
  } else {
    if (like && foundStock.likes.indexOf(ip) === -1) {
      foundStock.likes.push(ip); // Add IP to the likes if not already present
    }
    saved = await foundStock.save();
    return saved;
  }
}

// get stock data from external API
async function getStock(stock) {
  const response = await fetch(
    `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock}/quote`
  );
  const { symbol, latestPrice } = await response.json();
  return { symbol, latestPrice };
}

// Exports a function to define API routes for the application.
module.exports = function (app) {
  app.route('/api/stock-prices')
    .get(async function (req, res) {
      const { stock, like } = req.query;

      // Check if the stock is an array (multiple stocks)
      if (Array.isArray(stock)) {
        const stock1 = stock[0];
        const stock2 = stock[1];

        // Fetch stock data for both stocks
        const { symbol: symbol1, latestPrice: price1 } = await getStock(stock1);
        const { symbol: symbol2, latestPrice: price2 } = await getStock(stock2);

        // Save the stocks and likes
        const firstStock = await saveStock(stock1, like, req.ip);
        const secondStock = await saveStock(stock2, like, req.ip);

        // Calculate relative likes (difference in likes)
        const relLikes1 = firstStock.likes.length - secondStock.likes.length;
        const relLikes2 = secondStock.likes.length - firstStock.likes.length;

        // Construct the response for both stocks
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

        res.json({ stockData });
        return;
      }

      // For single stock requests
      const { symbol, latestPrice } = await getStock(stock);
      if (!symbol) {
        return res.json({ stockData: { likes: like ? 1 : 0 } });
      }

      const oneStockData = await saveStock(symbol, like, req.ip);

      res.json({
        stockData: {
          stock: symbol,
          price: latestPrice,
          likes: oneStockData.likes.length,
        }
      });
    });
};
