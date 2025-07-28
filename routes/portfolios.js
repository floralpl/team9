const express = require('express');
const router = express.Router();
const db = require('../db');

// 创建投资组合
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    const [result] = await db.query(
      'INSERT INTO portfolio (name, owner_id) VALUES (?, 1)',
      [name]
    );
    res.status(201).json({ id: result.insertId, name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取所有投资组合
router.get('/', async (req, res) => {
  try {
    const [portfolios] = await db.query('SELECT * FROM portfolio');
    res.json(portfolios);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取单个投资组合详情
router.get('/:id', async (req, res) => {
  try {
    const portfolioId = req.params.id;

    const [portfolio] = await db.query(
      'SELECT * FROM portfolio WHERE id = ?',
      [portfolioId]
    );

    if (portfolio.length === 0) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    const [assets] = await db.query(
      `SELECT a.id, a.symbol, a.name, a.price, a.type,
              pa.quantity, pa.purchase_price
       FROM portfolio_asset pa
       JOIN asset a ON pa.asset_id = a.id
       WHERE pa.portfolio_id = ?`,
      [portfolioId]
    );

    res.json({ ...portfolio[0], assets });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 删除投资组合
router.delete('/:id', async (req, res) => {
  try {
    const portfolioId = req.params.id;
    await db.query('DELETE FROM portfolio WHERE id = ?', [portfolioId]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

const { calculatePortfolioPerformance } = require('../utils/performance');

// 在获取单个投资组合详情中
router.get('/:id/performance', async (req, res) => {
  try {
    const portfolioId = req.params.id;
    const [portfolio] = await db.query(...); // 同上获取组合数据

    if (portfolio.length === 0) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    const portfolioWithAssets = {
      ...portfolio[0],
      assets: portfolioAssets // 从数据库获取的资产数据
    };

    const performance = calculatePortfolioPerformance(portfolioWithAssets);
    res.json(performance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});