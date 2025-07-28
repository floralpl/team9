const express = require('express');
const router = express.Router();
const db = require('../db');

// 添加资产到投资组合
router.post('/', async (req, res) => {
  try {
    const { portfolio_id, asset_id, quantity, purchase_price } = req.body;

    await db.query(
      `INSERT INTO portfolio_asset
       (portfolio_id, asset_id, quantity, purchase_price)
       VALUES (?, ?, ?, ?)`,
      [portfolio_id, asset_id, quantity, purchase_price]
    );

    res.status(201).json({
      portfolio_id,
      asset_id,
      quantity,
      purchase_price
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 从投资组合中移除资产
router.delete('/:portfolioId/:assetId', async (req, res) => {
  try {
    const { portfolioId, assetId } = req.params;

    await db.query(
      `DELETE FROM portfolio_asset
       WHERE portfolio_id = ? AND asset_id = ?`,
      [portfolioId, assetId]
    );

    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 更新投资组合中的资产
router.put('/:portfolioId/:assetId', async (req, res) => {
  try {
    const { portfolioId, assetId } = req.params;
    const { quantity, purchase_price } = req.body;

    await db.query(
      `UPDATE portfolio_asset
       SET quantity = ?, purchase_price = ?
       WHERE portfolio_id = ? AND asset_id = ?`,
      [quantity, purchase_price, portfolioId, assetId]
    );

    res.json({ portfolio_id: portfolioId, asset_id: assetId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;