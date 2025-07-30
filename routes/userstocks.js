const express = require('express');
const router = express.Router();
const db = require('../db');

// 获取用户持仓股票
router.get('/', async (req, res) => {
  try {
    const [stocks] = await db.query(`
      SELECT 
        p.stock_code AS symbol,
        s.stock_name AS name,
        s.current_price AS price,
        p.quantity,
        s.current_price * p.quantity AS value,
        (s.current_price - (s.history_price->>'$[0].price')) AS change,
        ((s.current_price - (s.history_price->>'$[0].price')) / 
        (s.history_price->>'$[0].price')) * 100 AS change_percent
      FROM portfolio p
      JOIN stock_info s ON p.stock_code = s.stock_code
    `);
    
    res.json(stocks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;