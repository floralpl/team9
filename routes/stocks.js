const express = require('express');
const router = express.Router();
const db = require('../db');

// 获取所有股票信息
router.get('/', async (req, res) => {
  try {
    const [stocks] = await db.query('SELECT * FROM stock_info');
    res.json(stocks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取单个股票详细信息
router.get('/:code', async (req, res) => {
  const { code } = req.params;
  
  try {
    const [stock] = await db.query(
      'SELECT * FROM stock_info WHERE stock_code = ?',
      [code]
    );
    
    if (stock.length === 0) {
      return res.status(404).json({ error: '股票不存在' });
    }
    
    res.json(stock[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 创建新股票
router.post('/', async (req, res) => {
  const { stock_code, stock_name, company_name, current_price } = req.body;
  
  // 验证必要字段
  if (!stock_code || !stock_name || !current_price) {
    return res.status(400).json({ error: '缺少必要参数' });
  }
  
  try {
    // 检查股票是否已存在
    const [existing] = await db.query(
      'SELECT stock_code FROM stock_info WHERE stock_code = ?',
      [stock_code]
    );
    
    if (existing.length > 0) {
      return res.status(409).json({ error: '股票代码已存在' });
    }
    
    // 创建新股票
    await db.query(
      `INSERT INTO stock_info 
        (stock_code, stock_name, company_name, current_price) 
       VALUES (?, ?, ?, ?)`,
      [stock_code, stock_name, company_name, current_price]
    );
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 更新股票价格
router.put('/:code/price', async (req, res) => {
  const { code } = req.params;
  const { new_price } = req.body;
  
  if (!new_price || isNaN(new_price) || new_price <= 0) {
    return res.status(400).json({ error: '无效的价格' });
  }
  
  try {
    // 获取当前价格
    const [current] = await db.query(
      'SELECT current_price FROM stock_info WHERE stock_code = ?',
      [code]
    );
    
    if (current.length === 0) {
      return res.status(404).json({ error: '股票不存在' });
    }
    
    // 更新价格
    await db.query(
      'UPDATE stock_info SET current_price = ? WHERE stock_code = ?',
      [new_price, code]
    );
    
    res.json({ 
      success: true,
      previousPrice: current[0].current_price,
      newPrice: new_price
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 删除股票
router.delete('/:code', async (req, res) => {
  const { code } = req.params;
  
  try {
    // 检查股票是否在投资组合中
    const [inPortfolio] = await db.query(
      'SELECT stock_code FROM portfolio WHERE stock_code = ?',
      [code]
    );
    
    if (inPortfolio.length > 0) {
      return res.status(400).json({ 
        error: '无法删除：该股票在投资组合中存在持仓' 
      });
    }
    
    // 删除股票
    const [result] = await db.query(
      'DELETE FROM stock_info WHERE stock_code = ?',
      [code]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '股票不存在' });
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;