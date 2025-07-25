const mysql = require('mysql2');

// ❌ REMOVE this since you're not using .env
// require('dotenv').config();

const pool = mysql.createPool({
  host: 'bx6hfmfa3xzzoaanhrg6-mysql.services.clever-cloud.com',
  user: 'u4wrzcqi32x7teyj',
  password: 'Glhf5OcDLSKP1Mn5oNmG',
  database: 'bx6hfmfa3xzzoaanhrg6',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ MySQL connection error:', err);
  } else {
    console.log('✅ Connected to MySQL database');
    connection.release();
  }
});

module.exports = pool;
