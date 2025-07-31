const express = require('express');
const router = express.Router();
const db = require('../db');

// 获取投资组合总览
router.get('/overview', async (req, res) => {
  try {
    // 计算现金余额
    const [cashResult] = await db.query(
      `SELECT 
        SUM(CASE WHEN trade_type = '收入' THEN amount ELSE 0 END) -
        SUM(CASE WHEN trade_type = '支出' THEN amount ELSE 0 END) AS balance
       FROM trade_record`
    );
    
    // 获取持仓股票
    const [holdings] = await db.query(
      `SELECT p.stock_code, p.quantity, s.current_price, s.stock_name
       FROM portfolio p
       JOIN stock_info s ON p.stock_code = s.stock_code`
    );
    
    // 计算股票总价值
    const stockValue = holdings.reduce((sum, item) => {
      return sum + (item.quantity * item.current_price);
    }, 0);
    
    // 计算总资产
    const totalAssets = cashResult[0].balance + stockValue;
    
    res.json({
      cashBalance: cashResult[0].balance,
      stockValue,
      totalAssets,
      holdings
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 添加股票到投资组合
router.post('/add', async (req, res) => {
  const { stock_code, quantity, price} = req.body;
  
  try {
    // 添加交易记录（支出）
    await db.query(
      `INSERT INTO trade_record (trade_type, trade_detail, amount)
       VALUES ('支出', '购买股票 ${stock_code}', ?)`,
      [quantity * price]
    );
    
    // 更新投资组合
    const [existing] = await db.query(
      `SELECT * FROM portfolio WHERE stock_code = ?`,
      [stock_code]
    );
    
    if (existing.length > 0) {
      await db.query(
        `UPDATE portfolio SET quantity = quantity + ? WHERE stock_code = ?`,
        [quantity, stock_code]
      );
    } else {
      await db.query(
        `INSERT INTO portfolio (stock_code, quantity) VALUES (?, ?)`,
        [stock_code, quantity]
      );
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 从投资组合移除股票
router.post('/remove', async (req, res) => {
  const { stock_code, quantity, price } = req.body;
  
  try {
    // 检查是否持有足够数量
    const [holding] = await db.query(
      `SELECT quantity FROM portfolio WHERE stock_code = ?`,
      [stock_code]
    );
    
    if (holding.length === 0 || holding[0].quantity < quantity) {
      return res.status(400).json({ error: '持有数量不足' });
    }
    
    // 添加交易记录（收入）
    await db.query(
      `INSERT INTO trade_record (trade_type, trade_detail, amount)
       VALUES ('收入', '出售股票 ${stock_code}', ?)`,
      [quantity * price]
    );
    
    // 更新投资组合
    if (holding[0].quantity === quantity) {
      await db.query(
        `DELETE FROM portfolio WHERE stock_code = ?`,
        [stock_code]
      );
    } else {
      await db.query(
        `UPDATE portfolio SET quantity = quantity - ? WHERE stock_code = ?`,
        [quantity, stock_code]
      );
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;