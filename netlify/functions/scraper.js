const { schedule } = require("@netlify/functions");
const webpush = require('web-push');
const { neon } = require('@neondatabase/serverless');
const qs = require('qs');

webpush.setVapidDetails(
  'mailto:contact@exemple.tg',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const sql = neon(process.env.DATABASE_URL);

function cleanPhone(phone) {
  if (!phone) return null;
  let cleaned = phone.replace(/[\s\-\.]/g, '');
  if (cleaned.startsWith('00228')) {
    cleaned = '+' + cleaned.substring(2);
  } else if (!cleaned.startsWith('+228') && cleaned.length >= 8) {
    if (cleaned.startsWith('228')) {
        cleaned = '+' + cleaned;
    } else {
        cleaned = '+228' + cleaned;
    }
  }
  return cleaned;
}

const scraperHandler = async (event) => {
  console.log("Démarrage du scraper Pharmacies de Garde (Togo)...");
  
  try {
    const today = new Date().toISOString().split('T')[0];
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
    
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
    }
    
    const json = await response.json();
    
    if (!json.data || json.data.length === 0) {
        console.warn("Aucune garde active n'a été trouvée pour aujourd'hui sur l'API.");
        return { statusCode: 200 };
    }
    
    const latestGarde = json.data[0];
    const periodeDe = latestGarde.de;
    const periodeA = latestGarde.a;
    
    const lastSaved = await sql`
        SELECT id FROM gardes WHERE date_debut = ${periodeDe} AND date_fin = ${periodeA} LIMIT 1
    `;
    
    if (lastSaved.length > 0) {
        console.log(`Garde actuelle (${periodeDe} au ${periodeA}) déjà en base. Fin du script.`);
        return { statusCode: 200 };
    }
    
    console.log(`Nouvelle rotation détectée: du ${periodeDe} au ${periodeA}. Mise à jour de la BDD...`);
    
    const gardeInsert = await sql`
        INSERT INTO gardes (date_debut, date_fin) VALUES (${periodeDe}, ${periodeA}) RETURNING id
    `;
    const insertedGardeId = gardeInsert[0].id;
    
    const listePharmacies = latestGarde.pharmacies || [];
    let compte = 0;
    const zonesTouchees = new Set();
    
    for (const p of listePharmacies) {
        try {
            const attrs = p.pharmacie;
            if (!attrs) continue;
            
            const zoneDataTitle = attrs.zone?.titre; 
            const nom = attrs.titre;
            const phone = cleanPhone(attrs.adresse?.telephone);
            const adresseText = attrs.adresse?.adresse || "";
            const assurances = JSON.stringify(attrs.assurances || []);
            const horaires = JSON.stringify(attrs.horaires || []);
            
            if (!nom || !zoneDataTitle) continue;
            
            const zoneRes = await sql`
                INSERT INTO zones (nom) VALUES (${zoneDataTitle}) 
                ON CONFLICT (nom) DO UPDATE SET nom=EXCLUDED.nom 
                RETURNING id
            `;
            const zoneId = zoneRes[0].id;
            
            const pharmaRes = await sql`
                INSERT INTO pharmacies (nom, telephone, adresse, assurances, horaires, zone_id) 
                VALUES (${nom}, ${phone}, ${adresseText}, ${assurances}::jsonb, ${horaires}::jsonb, ${zoneId})
                ON CONFLICT (nom, zone_id) DO UPDATE SET 
                  telephone = EXCLUDED.telephone,
                  adresse = EXCLUDED.adresse,
                  assurances = EXCLUDED.assurances,
                  horaires = EXCLUDED.horaires
                RETURNING id
            `;
            const pharmaId = pharmaRes[0].id;
            
            await sql`
                INSERT INTO pharmacies_gardes (garde_id, pharmacie_id)
                VALUES (${insertedGardeId}, ${pharmaId})
                ON CONFLICT DO NOTHING
            `;
            
            compte++;
            zonesTouchees.add(zoneId);
        } catch(e) {
            console.error(`Erreur d'insertion pharmacie: ${e.message}`);
        }
    }
    
    console.log(`Terminé: ${compte} pharmacies liées. Rotations OK.`);
    
    if (zonesTouchees.size > 0) {
        console.log(`[PUSH NOTIF] Envoi de notifications pour ${zonesTouchees.size} zone(s)...`);
        
        const zoneIds = Array.from(zonesTouchees);
        
        try {
            const abos = await sql`
                SELECT endpoint, keys_p256dh, keys_auth 
                FROM abonnements 
                WHERE zone_id = ANY(${zoneIds}::int[]) AND endpoint IS NOT NULL
            `;
            
            let sentCount = 0;
            const payload = JSON.stringify({
                title: 'Nouvelle rotation !',
                body: 'La liste des pharmacies de garde pour votre zone a été mise à jour.',
                icon: '/icons/icon-192x192.png',
                data: {
                    url: '/'
                }
            });
            
            for (const sub of abos) {
                const pushSubscription = {
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.keys_p256dh,
                        auth: sub.keys_auth
                    }
                };
                
                try {
                    await webpush.sendNotification(pushSubscription, payload);
                    sentCount++;
                } catch (error) {
                    if (error.statusCode === 410 || error.statusCode === 404) {
                        console.log(`L'abonnement ${sub.endpoint} est expiré/Gone (410). Suppression en base...`);
                        await sql`DELETE FROM abonnements WHERE endpoint = ${sub.endpoint}`;
                    } else {
                        console.error(`Erreur push vers ${sub.endpoint}:`, error.message);
                    }
                }
            }
            console.log(`[PUSH NOTIF] Bilan: ${sentCount} notifications envoyées avec succès. (Sur un total de ${abos.length} abonnements valides ciblés)`);
        } catch (pushErr) {
            console.error("Erreur générale lors de la boucle push:", pushErr);
        }
    }

    return { statusCode: 200, body: JSON.stringify({ action: "inserted", count: compte }) };
  } catch (err) {
    console.error("Crash scraper :", err);
    
    if (process.env.DISCORD_WEBHOOK_URL) {
        try {
            await fetch(process.env.DISCORD_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: `🚨 **Alerte Scraper PharmaGarde**
Le scraper a rencontré une erreur : `${err.message}`
📅 Date : ${new Date().toLocaleString('fr-FR')}`
                })
            });
            console.log("Alerte Discord envoyée.");
        } catch (discordErr) {
            console.error("Impossible d'envoyer l'alerte Discord:", discordErr.message);
        }
    }
    
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

//exports.handler = schedule("@daily", scraperHandler);

