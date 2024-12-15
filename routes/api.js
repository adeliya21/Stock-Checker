'use strict';
const StockModel = require("../models").Stock;
const fetch = require('node-fetch');

// create stock
async function createStock(stock, like, ip) {
  const newStock = new StockModel({
    symbol: stock,
    likes: like ? [ip] : []
  })
  const savedNew = await newStock.save()
  return savedNew
}

// find stock
async function findStock(stock) {
  return await StockModel.findOne({
    symbol: stock
  }).exec()
}

// save stock
async function saveStock(stock, like, ip) {
  let saved = {}
  const foundStock = await findStock(stock);
  if(!foundStock) {
    const createsaved = await createStock(stock, like, ip)
    saved = createsaved
    return saved
  } else {
    if (like && foundStock.likes.indexOf(ip) === -1) {
      foundStock.likes.push(ip)
    }
    saved = await foundStock.save()
    return saved
  }
}


// get stock fumction
async function getStock(stock) {
  const response = await fetch(
    `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock}/quote`
  )
  const { symbol, latestPrice } = await response.json()
  return { symbol, latestPrice }
}

// Exports a function to define API routes for the application.
module.exports = function (app) {
  app.route('/api/stock-prices')
    .get(async function (req, res){ // The code inside function (req, res) defines what happens when a GET request is made to '/api/stock-prices' route.
      const { stock, like } = req.query

      // check if stock is array (when we compare stocks)
      if (Array.isArray(stock)) {
        console.log("stocks", stock)
        const { symbol, latestPrice } = await getStock(stock[0])
        const { symbol: symbol2, latestPrice: latestPrice2 } = await getStock(stock[1])

        const firstStock = await saveStock(stock[0], like, req.ip)
        const secondStock = await saveStock(stock[1], like, req.ip)

        // construct stock data array
        let stockData = []

        if (!symbol) {
          stockDataa.push({
            rel_likes: firstStock.likes.length - secondStock.likes.length
          })
        } else {
          stockData.push({
            stock: symbol,
            price: latestPrice,
            rel_likes: firstStock.likes.length - secondStock.likes.length
          })
        }

        if (!symbol2) {
          stockDataa.push({
            rel_likes: secondStock.likes.length - firstStock.likes.length
          })
        } else {
          stockData.push({
            stock: symbol2,
            price: latestPrice,
            rel_likes: secondStock.likes.length - firstStock.likes.length
          })
        }

        res.json({
          stockData
        })
        return
      }

      // call get stock
      const { symbol, latestPrice } = await getStock(stock)
      if (!symbol) {
        res.json({ stockData: { likes: like ? 1 : 0 } })
        return
      }

      const oneStockData = await saveStock(symbol, like, req.ip)
      console.log("One Stock Data", oneStockData)

      res.json({
        stockData: {
          stock: symbol,
          price: latestPrice,
          likes: oneStockData.likes.length,
        }

      })
    }) 
};
