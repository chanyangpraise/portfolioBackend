const mariadb = require("mariadb");

const pool = mariadb.createPool({
  host: process.env.host,
  user: process.env.user,
  password: process.env.password,
  port: process.env.dbport,
  database: process.env.database,
  // SELECT COUNT를 했을 때 숫자로 받는 법
  supportBigNumbers: true,
  bigNumberStrings: true,
});

async function asyncSQL(sql) {
  console.log(sql);
  console.log(process.env.host);
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(sql);
    console.log(rows);
    return rows;
  } catch (err) {
    console.error(err);
  } finally {
    if (conn) conn.end();
  }
}

module.exports = asyncSQL;
