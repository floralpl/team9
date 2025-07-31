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

// 功能1：获取收入（cash、stock）、总收入、支出总额
router.get('/summary', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT trade_type, trade_detail, SUM(amount) AS total
      FROM trade_record
      GROUP BY trade_type, trade_detail
    `);

    let incomeCash = 0, incomeStock = 0, totalExpenditure = 0;

    rows.forEach(row => {
      if (row.trade_type === '收入') {
        if (row.trade_detail === 'bank') incomeCash = Number(row.total);
        else if (row.trade_detail === 'stock') incomeStock = Number(row.total);
      } else if (row.trade_type === '支出') {
        totalExpenditure += Number(row.total);
      }
    });

    res.json({
      income: {
        bank: incomeCash,
        stock: incomeStock,
        total: incomeCash + incomeStock,
      },
      expenditure: totalExpenditure,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 功能2：获取最近15天每天的**累积**净资产
router.get('/net-assets', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        DATE(trade_time) AS date,
        trade_type,
        SUM(amount) AS total
      FROM trade_record
      WHERE trade_time >= CURDATE() - INTERVAL 14 DAY
      GROUP BY DATE(trade_time), trade_type
      ORDER BY DATE(trade_time)
    `);

    // 整理每日收入和支出
    const dailyMap = {};
    rows.forEach(row => {
      const date = row.date.toISOString().split('T')[0];
      if (!dailyMap[date]) dailyMap[date] = { income: 0, expenditure: 0 };
      if (row.trade_type === '收入') dailyMap[date].income += Number(row.total);
      else if (row.trade_type === '支出') dailyMap[date].expenditure += Number(row.total);
    });

    const result = [];
    let cumulativeAsset = 0;

    for (let i = 14; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      const dayIncome = dailyMap[dateStr]?.income || 0;
      const dayExpenditure = dailyMap[dateStr]?.expenditure || 0;

      cumulativeAsset += (dayIncome - dayExpenditure);

      result.push({
        date: dateStr,
        income: dayIncome,
        expenditure: dayExpenditure,
        cumulative_net_asset: Number(cumulativeAsset.toFixed(2))
      });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 功能3：获取当前净资产（总收入 - 总支出）
router.get('/net-assets/current', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT trade_type, SUM(amount) AS total
      FROM trade_record
      GROUP BY trade_type
    `);

    let totalIncome = 0;
    let totalExpenditure = 0;

    rows.forEach(row => {
      if (row.trade_type === '收入') {
        totalIncome = Number(row.total);
      } else if (row.trade_type === '支出') {
        totalExpenditure = Number(row.total);
      }
    });

    const netAsset = totalIncome - totalExpenditure;

    res.json({
      income: totalIncome,
      expenditure: totalExpenditure,
      net_asset: Number(netAsset.toFixed(2))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;