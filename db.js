const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'n3u3da!',
  database: 'portfolio',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4', // 添加字符集配置
  // collation: 'utf8mb4_unicode_ci' // 添加排序规则配置
  typeCast: function (field, next) {
    if (field.type === 'VAR_STRING') {
      return field.string();
    }
    return next();
  }
});
////
module.exports = pool;