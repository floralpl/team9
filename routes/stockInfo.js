// routes/stockRoutes.js

const express = require('express');
const router = express.Router();
const StockInfoService = require('../services/stockInfoService');

// 模拟函数：从投资表中获取用户持有的股票代码
// 实际情况中应从数据库查询；这里只是占位
async function getStocks() {
  // 假设返回 ['AAPL', 'GOOG', 'TSLA', 'BABA']
  return ['AAPL', 'GOOG', 'TSLA', 'BABA'];
}

// 工具函数：计算涨跌幅（%）
function calculateChangePercent(historyPriceJson, currentPrice) {
  if (!historyPriceJson || !Array.isArray(historyPriceJson) || historyPriceJson.length === 0) return null;
  const lastDayPrice = historyPriceJson[historyPriceJson.length - 1]?.price;
  if (!lastDayPrice || isNaN(lastDayPrice)) return null;
  return (((currentPrice - lastDayPrice) / lastDayPrice) * 100).toFixed(2);
}

/**
 * 接口1：获取随机四个股票的涨跌幅
 * GET /api/stocks/random-changes
 */
router.get('/api/stocks/random-changes', async (req, res) => {
  try {
    const stocks = await StockInfoService.getRandomFourStocksWithHistory();
    const result = stocks.map(stock => {
      const history = JSON.parse(stock.history_price || '[]');
      const change = calculateChangePercent(history, stock.current_price);
      return {
        stock_code: stock.stock_code,
        stock_name: stock.stock_name,
        current_price: stock.current_price,
        change_percent: change
      };
    });
    res.json(result);
  } catch (err) {
    console.error('Error in /random-changes:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * 接口2：获取价格上涨的持有股票信息
 * GET /api/stocks/holding-up
 */
router.get('/api/stocks/holding-up', async (req, res) => {
  try {
    const stockCodes = await getStocks();
    const result = [];

    for (const code of stockCodes) {
      const info = await StockInfoService.getStockInfoByCode(code);
      const history = JSON.parse(info.history_price || '[]');
      const change = calculateChangePercent(history, info.current_price);
      if (change > 0) {
        result.push({
          stock_name: info.stock_name,
          company_name: info.company_name,
          change_percent: change
        });
      }
    }

    res.json(result);
  } catch (err) {
    console.error('Error in /holding-up:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * 接口3：获取价格下跌的持有股票信息
 * GET /api/stocks/holding-down
 */
router.get('/api/stocks/holding-down', async (req, res) => {
  try {
    const stockCodes = await getStocks();
    const result = [];

    for (const code of stockCodes) {
      const info = await StockInfoService.getStockInfoByCode(code);
      const history = JSON.parse(info.history_price || '[]');
      const change = calculateChangePercent(history, info.current_price);
      if (change < 0) {
        result.push({
          stock_name: info.stock_name,
          company_name: info.company_name,
          change_percent: change
        });
      }
    }

    res.json(result);
  } catch (err) {
    console.error('Error in /holding-down:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
