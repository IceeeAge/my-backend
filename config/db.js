const mysql = require('mysql2');


const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_PASSWORD,
  password: process.env.MYSQL_PORT,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
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