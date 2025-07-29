const express = require('express');
const router = express.Router();
const db = require('../db');

// 获取所有资产
router.get('/', async (req, res) => {
  try {
    const [assets] = await db.query('SELECT * FROM asset');
    res.json(assets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 创建新资产
router.post('/', async (req, res) => {
  try {
    const { symbol, name, price, type } = req.body;
    const [result] = await db.query(
      'INSERT INTO asset (symbol, name, price, type) VALUES (?, ?, ?, ?)',
      [symbol, name, price, type]
    );
    res.status(201).json({ id: result.insertId, symbol, name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;