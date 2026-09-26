const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Test@1234',
  database: process.env.DB_NAME || 'freelance_marketplace',
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  decimalNumbers: true
});

// Test connection on launch
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log(`[DB] Connected successfully to MySQL database "${process.env.DB_NAME || 'freelance_marketplace'}" on ${process.env.DB_HOST || '127.0.0.1'}:${process.env.DB_PORT || 3306}`);
    conn.release();
  } catch (err) {
    console.error('[DB] Connection error:', err.message);
  }
})();

module.exports = pool;
