const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'n3u3da!',
  database: 'protfolio',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
//
module.exports = pool;