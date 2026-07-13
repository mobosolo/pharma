
import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

async function check() {
    if (!process.env.DATABASE_URL) {
        console.error("DATABASE_URL is missing in .env file");
        process.exit(1);
    }
    const sql = neon(process.env.DATABASE_URL);
    
    try {
        console.log('--- Zones ---');
        const zones = await sql`SELECT * FROM zones`;
        console.log(JSON.stringify(zones, null, 2));
        
        console.log('--- Gardes ---');
        const gardes = await sql`SELECT * FROM gardes ORDER BY id DESC LIMIT 5`;
        console.log(JSON.stringify(gardes, null, 2));
        
        console.log('--- Pharmacies (first 5) ---');
        const pharmacies = await sql`SELECT * FROM pharmacies LIMIT 5`;
        console.log(JSON.stringify(pharmacies, null, 2));
        
        console.log('--- Pharmacies_Gardes (first 5) ---');
        const pg = await sql`SELECT * FROM pharmacies_gardes LIMIT 5`;
        console.log(JSON.stringify(pg, null, 2));
        
        const today = new Date().toISOString().split('T')[0];
        console.log('--- Active Gardes for today ---');
        console.log(today);
        const active = await sql`SELECT * FROM gardes WHERE date_debut <= ${today} AND date_fin >= ${today}`;
        console.log(JSON.stringify(active, null, 2));
    } catch (e) {
        console.error("Database error:", e);
    }
}

check();
