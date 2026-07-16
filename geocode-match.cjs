require('dotenv').config();
const { neon } = require('@neondatabase/serverless');
const https = require('https');

const sql = neon(process.env.DATABASE_URL);
const SOURCE_URL = 'https://sites.google.com/view/pharmaciedegarde-lome/tour-de-garde/';

function cleanPhone(phone) {
  if (!phone) return null;
  let cleaned = phone.replace(/[\s\-\.]/g, '');
  if (cleaned.startsWith('00228')) {
    cleaned = '+' + cleaned.substring(2);
  } else if (!cleaned.startsWith('+228') && cleaned.length >= 8) {
    cleaned = cleaned.startsWith('228') ? '+' + cleaned : '+228' + cleaned;
  }
  return cleaned;
}

function fetchGoogleSitesData() {
  return new Promise((resolve, reject) => {
    https.get(SOURCE_URL, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to fetch Google Sites: Status Code ${res.statusCode}`));
        return;
      }

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        // Découpe le HTML en blocs, un par occurrence de "☎"
        const blocks = data.split('☎');
        const entries = [];

        for (let i = 1; i < blocks.length; i++) {
          const block = blocks[i];

          // Téléphone : les chiffres juste après le "☎"
          const phoneMatch = block.match(/^[^\d]*([\d\s]{8,15})/);
          if (!phoneMatch) continue;
          const phone = cleanPhone(phoneMatch[1]);

          // Lien Maps avec coordonnées : cherche le premier !1d{lng}!2d{lat} après ce bloc
          const coordMatch = block.match(/!1d(-?\d+\.\d+)!2d(-?\d+\.\d+)/);
          if (!coordMatch) continue;

          const longitude = parseFloat(coordMatch[1]);
          const latitude = parseFloat(coordMatch[2]);

          entries.push({ phone, latitude, longitude });
        }

        resolve(entries);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function main() {
  console.log("Récupération des données du site Google Sites via https...");
  try {
    const geoEntries = await fetchGoogleSitesData();
    console.log(`${geoEntries.length} entrées avec coordonnées trouvées sur le site source.`);

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
        console.log(`✓ Matché : ${result[0].nom}`);
      } else {
        notFound++;
      }
    }

    console.log(`\nTerminé. ${matched} pharmacies géocodées, ${notFound} numéros sans correspondance dans notre base.`);
  } catch (err) {
    console.error("Erreur de traitement:", err.message);
  }
}

main().catch(err => {
  console.error("Erreur:", err.message);
  process.exit(1);
});
