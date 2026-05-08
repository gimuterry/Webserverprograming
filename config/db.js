const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',      // 내 컴퓨터에서 돌아가니까 localhost
  user: 'root',           // MySQL 기본 관리자 아이디
  password: 't9C}R)8<!gA7=Vc6G', 
  database: 'voice_chat_db', // 위에서 만든 데이터베이스 이름
  waitForConnections: true,
  connectionLimit: 10
});

console.log('✅ MySQL 서버와 연결 통로가 개설되었습니다.');

module.exports = pool;