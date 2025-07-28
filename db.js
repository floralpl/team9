const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'your_db_user',
  password: 'your_db_password',
  database: 'protfolio',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
//
module.exports = pool;