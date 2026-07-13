import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function run() {
    try {
        await sql`DROP TABLE IF EXISTS abonnements CASCADE`;
        await sql`
          CREATE TABLE abonnements (
            id SERIAL PRIMARY KEY,
            device_id VARCHAR(255) UNIQUE NOT NULL,
            endpoint TEXT,
            keys_p256dh TEXT,
            keys_auth TEXT,
            zone_id INT REFERENCES zones(id) ON DELETE CASCADE
          );
        `;
        console.log("Table abonnements modifiée pour supporter device_id UUID.");
    } catch (err) {
        console.error("Erreur SQL:", err);
    }
}
run();
