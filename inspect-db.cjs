require('dotenv').config();
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

async function inspect() {
  try {
    const res = await sql`SELECT * FROM pharmacies LIMIT 1`;
    console.log("Keys of a database row:", Object.keys(res[0] || {}));
    console.log("Sample database row:", res[0]);
  } catch (err) {
    console.error("Database connection / query error:", err.message);
  }
}

inspect();
