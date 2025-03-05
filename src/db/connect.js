const mysql = require('mysql2');

const pool = mysql.createPool({
  connectionLimit: 10,
  host: 'db', // IP ou localhost
  user: 'root', // alunods
  password: '?', // 
  database: 'test'
});

module.exports = pool;
