require('dotenv').config();
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function fetchAllPharmacies() {
  let all = [];
  // Tentative avec "pharmacies" ou "pharmcies" (on va tester les deux en cas d'erreur)
  const endpoints = ['pharmacies', 'pharmcies'];
  let successfulEndpoint = '';
  
  for (const ep of endpoints) {
    try {
      const url = `https://pharmaciens.tg/api/${ep}?populate=*&pagination[page]=1&pagination[pageSize]=5`;
      const res = await fetch(url);
      if (res.ok) {
        successfulEndpoint = ep;
        break;
      }
    } catch(e) {}
  }
  
  if (!successfulEndpoint) {
    throw new Error("Impossible de joindre l'API Strapi (les deux endpoints pharmacies et pharmcies ont échoué).");
  }
  
  console.log(`Endpoint valide trouvé : /api/${successfulEndpoint}`);
  
  for (let page = 1; page <= 3; page++) {
    const url = `https://pharmaciens.tg/api/${successfulEndpoint}?populate=*&pagination[page]=${page}&pagination[pageSize]=100&sort[]=titre:asc`;
    const res = await fetch(url);
    const data = await res.json();
    all = all.concat(data.data);
    console.log(`Page ${page}: ${data.data.length} entrées récupérées.`);
  }
  return all;
}

async function main() {
  console.log("Démarrage de l'analyse et récupération de l'API Strapi...");
  const pharmacies = await fetchAllPharmacies();

  console.log("\n--- STRUCTURE DU PREMIER ENREGISTREMENT ---");
  console.log(JSON.stringify(pharmacies[0], null, 2));
  console.log("-------------------------------------------\n");
  
  console.log("Vérification terminée. Ajustez les variables puis relancez le script complet.");
}

main().catch(err => { console.error('Erreur:', err.message); process.exit(1); });
