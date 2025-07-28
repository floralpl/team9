const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json());

// 路由导入
const portfolioRoutes = require('./routes/portfolios');
const assetRoutes = require('./routes/assets');
const portfolioAssetRoutes = require('./routes/portfolioAssets');

// 路由注册
app.use('/api/portfolios', portfolioRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/portfolio-assets', portfolioAssetRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});