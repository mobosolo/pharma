const fs = require('fs');
const logFile = 'test-results.log';
// Clear previous log file
fs.writeFileSync(logFile, '=== START TEST ===\n');

function log(msg) {
  fs.appendFileSync(logFile, msg + '\n');
  console.log(msg);
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function geocodeAddress(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    if (!res.ok) {
      log(`  HTTP status error: ${res.status}`);
      return null;
    }
    const results = await res.json();
    if (results.length === 0) return null;
    return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon), displayName: results[0].display_name };
  } catch (err) {
    log(`  Error fetching "${query}": ${err.message}`);
    return null;
  }
}

async function test() {
  const samples = [
    { nom: 'Pharmacie SOLIDARITE', addr: "Rue Avédji Limousine, Près de l'UTB Totsi BP : 8919 Lomé - TOGO" },
    { nom: "Pharmacie CHÂTEAU D'EAU", addr: "Pres du Chateau d'eau de BE" },
    { nom: 'Pharmacie NATION', addr: 'Face ancien marché de TOTSI' },
    { nom: 'Pharmacie ISIS', addr: 'Avenue Jean Paul II près des rails NUKAFU Gakpoto' },
    { nom: 'Pharmacie BETHEL', addr: 'ADIDOGOME Soviépé Bd du 30 Aout face Orabank et Banque Atlantique' }
  ];

  log(`Total samples: ${samples.length}`);

  for (let i = 0; i < samples.length; i++) {
    const item = samples[i];
    log(`\nTesting [${i + 1}/${samples.length}]: ${item.nom}`);
    
    // Strategy 1: Search by name
    const q1 = `${item.nom}, Lomé, Togo`;
    log(`  Trying Q1: "${q1}"`);
    const res1 = await geocodeAddress(q1);
    
    if (res1) {
      log(`  -> SUCCESS (Q1): ${res1.lat}, ${res1.lng} (${res1.displayName})`);
    } else {
      log(`  -> FAILED (Q1)`);
      // Strategy 2: Search by cleaning address
      let cleanAddr = item.addr
        .replace(/BP\s*:\s*\d+/gi, '')
        .replace(/BP\s*\d+/gi, '')
        .replace(/B\.P\.\s*\d+/gi, '')
        .replace(/Pres/gi, '')
        .replace(/du/gi, '')
        .replace(/de/gi, '')
        .replace(/de l'/gi, '')
        .replace(/Face/gi, '')
        .replace(/Sise a/gi, '')
        .replace(/Quartier/gi, '')
        .trim();
      const q2 = `${cleanAddr}, Lomé, Togo`;
      log(`  Trying Q2: "${q2}"`);
      await sleep(1100);
      const res2 = await geocodeAddress(q2);
      if (res2) {
        log(`  -> SUCCESS (Q2): ${res2.lat}, ${res2.lng} (${res2.displayName})`);
      } else {
        log(`  -> FAILED (Q2)`);
      }
    }
    
    log(`Finished testing ${item.nom}. Sleeping 1.1s for rate limit...`);
    await sleep(1100);
  }
  log('\n=== END TEST ===');
}

test().catch(err => {
  log(`UNCAUGHT ERROR: ${err.stack}`);
});
