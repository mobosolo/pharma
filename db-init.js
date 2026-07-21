import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function initDB() {
  console.log("Initialisation de la base de données PostgreSQL sur Neon...");

  try {
    await sql`DROP TABLE IF EXISTS abonnements CASCADE`;
    await sql`DROP TABLE IF EXISTS pharmacies_gardes CASCADE`;
    await sql`DROP TABLE IF EXISTS pharmacies CASCADE`;
    await sql`DROP TABLE IF EXISTS gardes CASCADE`;
    await sql`DROP TABLE IF EXISTS zones CASCADE`;
      
    await sql`
      CREATE TABLE zones (
        id SERIAL PRIMARY KEY,
        nom VARCHAR(255) UNIQUE NOT NULL
      );
    `;
    console.log("Table 'zones' recréée.");

    await sql`
      CREATE TABLE pharmacies (
        id SERIAL PRIMARY KEY,
        nom VARCHAR(255) NOT NULL,
        telephone VARCHAR(50) UNIQUE,
        adresse TEXT,
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        assurances JSONB DEFAULT '[]'::jsonb,
        horaires JSONB DEFAULT '[]'::jsonb,
        zone_id INT REFERENCES zones(id) ON DELETE SET NULL
      );
    `;
    console.log("Table 'pharmacies' recréée.");

    await sql`
      CREATE TABLE gardes (
        id SERIAL PRIMARY KEY,
        date_debut DATE NOT NULL,
        date_fin DATE NOT NULL,
        UNIQUE (date_debut, date_fin)
      );
    `;

    await sql`
      CREATE TABLE pharmacies_gardes (
        garde_id INT REFERENCES gardes(id) ON DELETE CASCADE,
        pharmacie_id INT REFERENCES pharmacies(id) ON DELETE CASCADE,
        PRIMARY KEY (garde_id, pharmacie_id)
      );
    `;

    await sql`
      CREATE TABLE abonnements (
        id SERIAL PRIMARY KEY,
        endpoint TEXT NOT NULL,
        keys_p256dh TEXT NOT NULL,
        keys_auth TEXT NOT NULL,
        zone_id INT REFERENCES zones(id) ON DELETE CASCADE,
        UNIQUE(endpoint)
      );
    `;

    console.log("Toutes les tables recréées avec succès.");
  } catch (err) {
    console.error("Erreur lors de l'initialisation de la base de données:", err);
  }
}

initDB();
