const express = require('express');
const router = express.Router();
const db = require('../db');

// 获取交易记录
router.get('/', async (req, res) => {
  try {
    const [trades] = await db.query(
      `SELECT * FROM trade_record ORDER BY trade_time DESC`
    );
    res.json(trades);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 添加自定义交易
router.post('/', async (req, res) => {
  const { type, detail, amount } = req.body;
  
  try {
    await db.query(
      `INSERT INTO trade_record (trade_type, trade_detail, amount)
       VALUES (?, ?, ?)`,
      [type, detail, amount]
    );
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;