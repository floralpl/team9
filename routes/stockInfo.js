const express = require('express');
const router = express.Router();
const StockInfoService = require('../service/stockInfoService');

// ⚠️ 示例函数，实际应从数据库查询投资表
async function getStocks() {
  return ['AAPL', 'GOOG', 'TSLA', 'BABA'];
}

// 计算涨跌幅（%）
function calculateChangePercent(historyPriceJson, currentPrice) {
  if (!Array.isArray(historyPriceJson) || historyPriceJson.length === 0) return null;
  const lastDay = historyPriceJson[historyPriceJson.length - 3];
  if (!lastDay?.price) return null;
  return (((currentPrice - lastDay.price) / lastDay.price) * 100).toFixed(2);
}

/**
 * 接口1：获取随机4个股票的涨跌幅
 * GET /api/stocks/random-changes
 */
router.get('/random-changes', async (req, res) => {
    try {
      const stocks = await StockInfoService.getRandomFourStocksWithHistory();
      const result = stocks.map(stock => {
        let history = [];
  
        try {
          history = Array.isArray(stock.history_price)
            ? stock.history_price
            : JSON.parse(stock.history_price || '[]');
        } catch (e) {
          console.warn(`Failed to parse history_price for ${stock.stock_code}:`, e);
        }
  
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
 * 接口2：获取持有股票中价格上涨的
 * GET /api/stocks/holding-up
 */
router.get('/holding-up', async (req, res) => {
  try {
    const stockCodes = await getStocks();
    const result = [];

    for (const code of stockCodes) {
      const info = await StockInfoService.getStockInfoByCode(code);
      let history = [];
  
        try {
          history = Array.isArray(stock.history_price)
            ? stock.history_price
            : JSON.parse(stock.history_price || '[]');
        } catch (e) {
          console.warn(`Failed to parse history_price for ${stock.stock_code}:`, e);
        }
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
 * 接口3：获取持有股票中价格下跌的股票及跌幅
 * GET /api/stocks/holding-down
 */
router.get('/holding-down', async (req, res) => {
  try {
    const stockCodes = await getStocks();
    const result = [];

    for (const code of stockCodes) {
      const info = await StockInfoService.getStockInfoByCode(code);
      let history = [];
  
        try {
          history = Array.isArray(stock.history_price)
            ? stock.history_price
            : JSON.parse(stock.history_price || '[]');
        } catch (e) {
          console.warn(`Failed to parse history_price for ${stock.stock_code}:`, e);
        }
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

/**
 * 接口4：根据股票代码获取完整信息
 * GET /api/stocks/:code
 */
router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const info = await StockInfoService.getStockInfoByCode(code);
    if (!info) {
      return res.status(404).json({ error: 'Stock not found' });
    }
    res.json(info);
  } catch (err) {
    console.error('Error in /:code:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * 接口5：根据股票代码与日期查询价格
 * GET /api/stocks/:code/price?date=YYYY-MM-DD
 */
router.get('/:code/price', async (req, res) => {
  try {
    const { code } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Missing date parameter' });
    }

    const info = await StockInfoService.getStockInfoByCode(code);
    if (!info) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    if (date === new Date().toISOString().split('T')[0]) {
      // 日期为今天，返回 current_price
      return res.json({ price: info.current_price });
    }

    const history = JSON.parse(info.history_price || '[]');
    const entry = history.find(item => item.date === date);

    if (entry) {
      res.json({ price: entry.price });
    } else {
      res.status(404).json({ error: 'Price not found for given date' });
    }
  } catch (err) {
    console.error('Error in /:code/price:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
