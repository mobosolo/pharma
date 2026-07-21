require('dotenv').config();
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

async function inspect() {
  try {
    const total = await sql`SELECT count(*) FROM pharmacies`;
    const missing = await sql`SELECT count(*) FROM pharmacies WHERE latitude IS NULL`;
    const samples = await sql`SELECT nom, telephone, adresse, latitude, longitude FROM pharmacies WHERE latitude IS NULL LIMIT 5`;
    console.log("Total pharmacies:", total[0].count);
    console.log("Missing coords:", missing[0].count);
    console.log("Samples missing coords:", samples);
  } catch (err) {
    console.error("Database error:", err.message);
  }
}

inspect();
