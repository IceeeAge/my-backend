const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'suhud1313',
  database: 'mysql_database',
});

db.connect((err) => {
  if (err) return console.error('❌ Database connection error:', err);
  console.log('✅ Connected to MySQL');
});

module.exports = db;
