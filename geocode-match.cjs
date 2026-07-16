require('dotenv').config();
const { neon } = require('@neondatabase/serverless');
const https = require('https');

const sql = neon(process.env.DATABASE_URL);
const SOURCE_URL = 'https://sites.google.com/view/pharmaciedegarde-lome/tour-de-garde/';

function cleanPhone(phone) {
  if (!phone) return null;
  let cleaned = phone.replace(/[^\d]/g, '');
  if (cleaned.length === 8) {
    cleaned = '228' + cleaned;
  } else if (cleaned.startsWith('00228')) {
    cleaned = cleaned.substring(2);
  }
  return '+' + cleaned;
}

function fetchGoogleSitesData() {
  return new Promise((resolve, reject) => {
    https.get(SOURCE_URL, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to fetch Google Sites: Status Code ${res.statusCode}`));
        return;
      }

      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const blocks = data.split('☎');
        const entries = [];

        console.log(`Découpage en ${blocks.length} blocs après '☎'`);

        for (let i = 1; i < blocks.length; i++) {
          const block = blocks[i];

          // On extrait les 1500 premiers caractères du bloc et on enlève les balises HTML
          const snippet = block.substring(0, 1500);
          const textOnly = snippet.replace(/<[^>]*>/g, ' ');
          
          // Recherche d'un motif de téléphone (8 chiffres, potentiellement espacés)
          // Le premier groupe de chiffres d'au moins 8 caractères après '☎'
          const phoneMatch = textOnly.match(/([\d\s]{8,15})/);
          if (!phoneMatch) {
            continue;
          }
          
          const phone = cleanPhone(phoneMatch[1]);

          // Lien Maps avec coordonnées : cherche le premier !1d{lng}!2d{lat} après ce bloc
          const coordMatch = block.match(/!1d(-?\d+\.\d+)!2d(-?\d+\.\d+)/);
          if (!coordMatch) {
            continue;
          }

          const longitude = parseFloat(coordMatch[1]);
          const latitude = parseFloat(coordMatch[2]);

          entries.push({ phone, latitude, longitude, rawPhoneText: phoneMatch[1].trim() });
        }

        resolve(entries);
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log("Récupération des données de géolocalisation...");
  try {
    const geoEntries = await fetchGoogleSitesData();
    console.log(`${geoEntries.length} entrées valides extraites du site source.`);

    let matched = 0;
    let notFound = 0;

    for (const entry of geoEntries) {
      if (!entry.phone) continue;

      const result = await sql`
        UPDATE pharmacies
        SET latitude = ${entry.latitude}, longitude = ${entry.longitude}
        WHERE telephone = ${entry.phone}
        RETURNING id, nom
      `;

      if (result.length > 0) {
        matched++;
        console.log(`✓ Matché : ${result[0].nom} (${entry.phone}) -> lat: ${entry.latitude}, lng: ${entry.longitude}`);
      } else {
        notFound++;
        console.log(`✗ Non trouvé : ${entry.phone} (brut: "${entry.rawPhoneText}")`);
      }
    }

    console.log(`\nBilan : ${matched} pharmacies géocodées avec succès.`);
    console.log(`${notFound} numéros n'ont pas trouvé de correspondance.`);
  } catch (err) {
    console.error("Erreur de traitement:", err.message);
  }
}

main().catch(err => {
  console.error("Erreur générale:", err.message);
  process.exit(1);
});
