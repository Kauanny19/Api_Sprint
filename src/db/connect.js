const mysql = require('mysql2');

const pool = mysql.createPool({
  connectionLimit: 10,
  host: '10.89.240.69', // IP ou localhost
  user: 'gabi', // alunods
  password: 'senai@604', // 
  database: 'senai'
});

module.exports = pool;
