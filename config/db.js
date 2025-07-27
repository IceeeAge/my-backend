const mysql = require('mysql2');


const pool = mysql.createPool({
  host: '127.0.0.1',
  user: 'root',
  password:'suhud1313',
  database: 'mysql_database',
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