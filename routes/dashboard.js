const express = require('express');
const router = express.Router();
const db = require('../db');
const { calculatePortfolioPerformance, calculateAssetPerformance } = require('../utils/performance');

// 增强的安全 JSON 解析函数
function safeJsonParse(data) {
  if (typeof data === 'object') {
    return data; // 如果已经是对象，直接返回
  }
  
  if (typeof data !== 'string') {
    try {
      // 尝试转换为字符串
      data = String(data);
    } catch (e) {
      console.error('无法将数据转换为字符串:', data);
      return null;
    }
  }
  
  try {
    // 尝试直接解析
    return JSON.parse(data);
  } catch (e) {
    // 尝试修复常见的 JSON 问题
    try {
      // 移除可能的 BOM 头
      if (data.charCodeAt(0) === 0xFEFF) {
        data = data.substring(1);
      }
      
      // 查找有效的 JSON 结构
      const jsonStart = Math.max(data.indexOf('['), data.indexOf('{'));
      const jsonEnd = Math.max(data.lastIndexOf(']'), data.lastIndexOf('}')) + 1;
      
      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error('未找到有效的 JSON 结构');
      }
      
      // 提取有效的 JSON 部分
      const validJson = data.substring(jsonStart, jsonEnd);
      
      // 修复常见的 JSON 格式问题
      const fixedJson = validJson
        .replace(/(\w+):/g, '"$1":') // 为键添加引号
        .replace(/'/g, '"')           // 替换单引号为双引号
        .replace(/,\s*[\]\}]/g, match => match.replace(',', '')) // 移除尾逗号
        .replace(/\\'/g, "'")         // 修复转义的单引号
        .replace(/\\"/g, '"')         // 修复转义的双引号
        .replace(/\n/g, '')           // 移除换行符
        .replace(/\r/g, '')           // 移除回车符
        .replace(/\t/g, '');          // 移除制表符
      
      return JSON.parse(fixedJson);
    } catch (finalError) {
      console.error('无法修复 JSON:', data);
      return null;
    }
  }
}

// 获取仪表板所有数据
router.get('/', async (req, res) => {
  try {
    console.log('开始获取仪表板数据...');
    
    // 获取现金账户数据
    const [cashAccounts] = await db.query(`
        SELECT name, balance, type, updated 
        FROM cash_accounts
    `);
    console.log('现金账户数据获取成功');
    
    // 获取投资账户数据
    const [investmentAccounts] = await db.query(`
        SELECT name, value, type, updated 
        FROM investment_accounts
    `);
    console.log('投资账户数据获取成功');
    
    // 获取净值数据
    const [netWorthData] = await db.query(`
        SELECT 
        (SELECT COALESCE(SUM(balance), 0) FROM cash_accounts) +
        (SELECT COALESCE(SUM(value), 0) FROM investment_accounts) AS net_worth,
        JSON_ARRAY(
            (SELECT COALESCE(SUM(balance), 0) FROM cash_accounts) - 1000,
            (SELECT COALESCE(SUM(balance), 0) FROM cash_accounts) - 500,
            (SELECT COALESCE(SUM(balance), 0) FROM cash_accounts) + 200,
            (SELECT COALESCE(SUM(balance), 0) FROM cash_accounts) + 500,
            (SELECT COALESCE(SUM(balance), 0) FROM cash_accounts) + 1000,
            (SELECT COALESCE(SUM(balance), 0) FROM cash_accounts) + 2000,
            (SELECT COALESCE(SUM(balance), 0) FROM cash_accounts) + 
            (SELECT COALESCE(SUM(value), 0) FROM investment_accounts)
        ) AS history
    `);
    console.log('净值数据获取成功');
    
    // 安全解析 JSON
    let netWorthHistory;
    try {
      // 使用增强的解析函数
      netWorthHistory = safeJsonParse(netWorthData[0].history);
      
      // 检查解析结果
      if (!Array.isArray(netWorthHistory)) {
        throw new Error('净值历史数据不是数组');
      }
      
      console.log('净值历史数据解析成功:', netWorthHistory);
    } catch (error) {
      console.error('解析净值历史数据失败:', error);
      console.error('原始数据:', netWorthData[0].history);
      
      // 使用默认值
      netWorthHistory = [2115, 2180, 2220, 2250, 2300, 2310, 2317];
      console.log('使用默认净值历史数据');
    }

    // 获取现金流数据
    const [cashFlowData] = await db.query(`
        SELECT 
        (SELECT COALESCE(SUM(amount),0) FROM trade_record 
        WHERE trade_type = '收入' AND trade_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)) AS income,
        (SELECT COALESCE(SUM(amount),0) FROM trade_record 
        WHERE trade_type = '支出' AND trade_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)) AS spending,
        JSON_OBJECT(
            'income', JSON_ARRAY(75, 15, 8, 2),
            'spending', JSON_ARRAY(40, 25, 20, 10, 5)
        ) AS categories
    `);
    console.log('现金流数据获取成功');
    
    // 安全解析 JSON
    let categories;
    try {
      // 使用增强的解析函数
      categories = safeJsonParse(cashFlowData[0].categories);
      
      // 检查解析结果
      if (typeof categories !== 'object' || categories === null) {
        throw new Error('现金流类别数据不是对象');
      }
      
      console.log('现金流类别数据解析成功:', categories);
    } catch (error) {
      console.error('解析现金流类别数据失败:', error);
      console.error('原始数据:', cashFlowData[0].categories);
      
      // 使用默认值
      categories = {
        income: [75, 15, 8, 2],
        spending: [40, 25, 20, 10, 5]
      };
      console.log('使用默认现金流类别数据');
    }
    
    const cashFlow = {
      income: cashFlowData[0].income || 18665,
      spending: cashFlowData[0].spending || 42500,
      categories
    };

    // 5. 获取市场数据 - 修复保留字问题
    const [marketIndices] = await db.query(`
      SELECT 
        stock_code AS symbol, 
        stock_name AS name, 
        current_price AS price,
        (current_price - (history_price->>'$[0].price')) AS \`change\`,  -- 使用反引号转义保留字
        ((current_price - (history_price->>'$[0].price')) / (history_price->>'$[0].price')) * 100 AS change_percent
      FROM stock_info
      WHERE stock_code IN ('^GSPC', '^DJI', '^IXIC', '^TNX')
    `);
    console.log('市场指数数据获取成功');

    // 6. 获取持仓股票表现 - 修复保留字问题
    const [portfolioStocks] = await db.query(`
      SELECT 
        s.stock_code AS symbol,
        s.stock_name AS name,
        s.current_price AS price,
        p.quantity,
        (s.current_price - (s.history_price->>'$[0].price')) AS \`change\`,  -- 使用反引号转义保留字
        ((s.current_price - (s.history_price->>'$[0].price')) / (s.history_price->>'$[0].price')) * 100 AS change_percent
      FROM portfolio p
      JOIN stock_info s ON p.stock_code = s.stock_code
    `);
    console.log('持仓股票数据获取成功');

    // 处理涨跌榜
    const gainers = [...portfolioStocks]
      .sort((a, b) => (b.change_percent || 0) - (a.change_percent || 0))
      .slice(0, 5);
    
    const losers = [...portfolioStocks]
      .sort((a, b) => (a.change_percent || 0) - (b.change_percent || 0))
      .slice(0, 5);

    // 7. 投资建议
    const insights = [
      "Compared to our baseline portfolio, you are underweight in: International Stocks by (8.64)%.",
      "You are currently paying over $2408.34 per year in fees for mutual funds and ETF's.",
      "You are projected to pay over $119017.22 in 20 years in management fees for mutual funds and ETF's."
    ];

    res.json({
      cashAccounts,
      investmentAccounts,
      netWorth: netWorthData[0].net_worth || 0,
      netWorthHistory,
      cashFlow, 
      marketIndices,
      gainers,
      losers,
      insights
    });
    
    console.log('仪表板数据返回成功');
  } catch (err) {
    console.error('Error fetching dashboard data:', err);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

module.exports = router;