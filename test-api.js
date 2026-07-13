import fs from 'fs';
import qs from 'qs';

const today = new Date().toISOString().split('T')[0];

async function run() {
    const query = qs.stringify({
      filters: { 
          a: { $gte: today }, 
          de: { $lte: today } 
      },
      populate: {
          pharmacies: {
              populate: {
                  pharmacie: {
                      populate: ['adresse', 'zone', 'assurances', 'horaires']
                  }
              }
          }
      }
    }, { encodeValuesOnly: true });

    const url = `https://pharmaciens.tg/api/pharmacies-de-gardes?` + query;
    try {
        const res = await fetch(url);
        const json = await res.json();
        const firstPharma = json.data[0]?.pharmacies?.[0]?.pharmacie;
        fs.writeFileSync('api-out.json', JSON.stringify(firstPharma || json, null, 2));
    } catch(e) {
        fs.writeFileSync('api-out.json', e.message);
    }
}
run();
