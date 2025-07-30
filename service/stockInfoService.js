// services/stockInfoService.js

const pool = require('../db'); // 引入数据库连接池

const StockInfoService = {


    /**
   * 从投资表中获取所有持有的股票代码
   * @returns {Promise<Array<string>>}
   */
  async getStocks() {
    const [rows] = await pool.query(
      'SELECT stock_code FROM portfolio'
    );
    return rows.map(row => row.stock_code);
  },


  /**
   * 根据股票代码查询所有信息
   * @param {string} stockCode
   * @returns {Promise<Object|null>}
   */
  async getStockInfoByCode(stockCode) {
    const [rows] = await pool.query(
      'SELECT * FROM stock_info WHERE stock_code = ?',
      [stockCode]
    );
    return rows[0] || null;
  },

  /**
   * 根据股票代码查询当前价格
   * @param {string} stockCode
   * @returns {Promise<Number|null>}
   */
  async getCurrentPriceByCode(stockCode) {
    const [rows] = await pool.query(
      'SELECT current_price FROM stock_info WHERE stock_code = ?',
      [stockCode]
    );
    return rows[0] ? rows[0].current_price : null;
  },

  /**
   * 随机获取4个股票的当前价格和历史价格
   * @returns {Promise<Array>}
   */
  async getRandomFourStocksWithHistory() {
    const [rows] = await pool.query(
      'SELECT stock_code, stock_name, current_price, history_price FROM stock_info ORDER BY RAND() LIMIT 4'
    );
    return rows;
  }
};

module.exports = StockInfoService;
