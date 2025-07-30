const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./db');
const dashboardRouter = require('./routes/dashboard');

const app = express();
const PORT = 5000;

// 测试数据库连接
(async () => {
  try {
    const [rows] = await db.query('SELECT 1 + 1 AS solution');
    console.log('数据库连接成功:', rows[0].solution === 2);
  } catch (err) {
    console.error('数据库连接失败:', err);
  }
})();

// 中间件
app.use(cors());
app.use(bodyParser.json());

// 路由
app.use('/api/portfolio', require('./routes/portfolios'));
app.use('/api/stocks', require('./routes/stocks'));
app.use('/api/trades', require('./routes/trades'));
app.use('/api/dashboard', dashboardRouter);
app.use('/api/stockInfo', require('./routes/stockInfo'));
// 设置初始现金
// 设置初始现金
app.post('/api/initialize', async (req, res) => {
  const { amount } = req.body;
  
  try {
    // 第一步：禁用外键检查
    await db.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // 第二步：删除所有数据（使用DELETE代替TRUNCATE）
    await db.query('DELETE FROM portfolio');
    await db.query('DELETE FROM trade_record');
    
    // 第三步：重置自增ID（如果需要）
    await db.query('ALTER TABLE trade_record AUTO_INCREMENT = 1');
    //await db.query('ALTER TABLE portfolio_asset AUTO_INCREMENT = 1'); // 如果存在portfolio_asset表
    
    // 第四步：启用外键检查
    await db.query('SET FOREIGN_KEY_CHECKS = 1');
    
    // 设置初始现金
    await db.query(
      `INSERT INTO trade_record (trade_type, trade_detail, amount)
       VALUES ('收入', '初始资金', ?)`,
      [amount]
    );
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});