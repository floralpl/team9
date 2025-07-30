const pool = require('../db');
const yahooFinance = require('yahoo-finance2').default;
const cron = require('node-cron');

const FIXED_STOCK_CODES = [
  'AAPL', 'MSFT', 'GOOG', 'AMZN', 'TSLA',
  'META', 'NVDA', 'NFLX', 'INTC', 'AMD',
  'BABA', 'TCEHY', 'UBER', 'LYFT', 'DIS',
  'NKE', 'ADBE', 'ORCL', 'CRM', 'PYPL',
  'PDD', 'JD', 'BIDU', 'SHOP', 'BA',
  'SONY', 'ZM', 'TWLO', 'SPOT', 'PLTR',
  'COIN', 'SNOW', 'ROKU', 'WMT', 'COST',
  'MCD', 'V', 'MA', 'JPM', 'BAC',
  'XOM', 'CVX', 'BP', 'TSM', 'ASML',
  'SBUX', 'PEP', 'KO', 'T', 'GS'
];

const getTodayString = () => {
  return new Date().toISOString().slice(0, 10);
};

const getDateNDaysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

async function updateStockInfo() {
  console.log(`[${new Date().toLocaleString()}] 正在更新股票信息...`);
  const connection = await pool.getConnection();

  try {
    for (const code of FIXED_STOCK_CODES) {
      try {
        const quote = await yahooFinance.quote(code);
        const currentPrice = quote.regularMarketPrice;
        const stockName = quote.shortName || quote.displayName || '';
        const companyName = quote.longName || '';
        const today = getTodayString();

        const [rows] = await connection.execute(
          'SELECT history_price FROM stock_info WHERE stock_code = ?',
          [code]
        );

        let history = [];

        if (rows.length > 0 && rows[0].history_price) {
          try {
            const oldHistory = JSON.parse(rows[0].history_price);
            history = oldHistory.filter(entry => {
              const date = new Date(entry.date);
              return (Date.now() - date.getTime()) <= 15 * 24 * 60 * 60 * 1000;
            });
          } catch (e) {
            console.warn(`⚠️ 历史记录解析错误: ${code}`);
          }
        }

        // 如果历史为空，说明首次执行，需要补全最近15天数据
        if (history.length === 0) {
          const startDate = getDateNDaysAgo(15);
          const historical = await yahooFinance.historical(code, {
            period1: startDate,
            interval: '1d'
          });

          history = historical
            .filter(day => day.close !== undefined)
            .map(day => ({
              date: day.date.toISOString().slice(0, 10),
              price: day.close
            }));
        }

        // 添加今天记录（如不存在）
        if (!history.some(entry => entry.date === today)) {
          history.push({ date: today, price: currentPrice });
        }

        // 保留最近15天记录
        history = history.filter(entry => {
          const date = new Date(entry.date);
          return (Date.now() - date.getTime()) <= 15 * 24 * 60 * 60 * 1000;
        });

        const historyStr = JSON.stringify(history);

        await connection.execute(
          `REPLACE INTO stock_info 
           (stock_code, stock_name, company_name, current_price, history_price)
           VALUES (?, ?, ?, ?, ?)`,
          [code, stockName, companyName, currentPrice, historyStr]
        );

        console.log(`✅ ${code} 更新完成`);
      } catch (innerErr) {
        console.error(`❌ 更新 ${code} 失败:`, innerErr.message);
      }
    }

    console.log('🎉 所有股票更新完毕');
  } catch (err) {
    console.error('数据库操作异常:', err);
  } finally {
    connection.release();
  }
}

// 每小时第0分钟执行
cron.schedule('0 * * * *', updateStockInfo);

// 立即运行一次（首次补全历史）
updateStockInfo();
