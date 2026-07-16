const { neon } = require('@neondatabase/serverless');

function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

exports.handler = async (event) => {
    const headers = { 
        "Content-Type": "application/json", 
        "Access-Control-Allow-Origin": "*" 
    };
    
    if (event.httpMethod !== "GET") {
        return { statusCode: 405, headers, body: JSON.stringify({error: "Method Not Allowed"}) };
    }
    
    try {
        const latParam = event.queryStringParameters?.lat;
        const lngParam = event.queryStringParameters?.lng;
        
        if (!latParam || !lngParam) {
            return { statusCode: 400, headers, body: JSON.stringify({error: "Les paramètres lat et lng sont obligatoires."}) };
        }
        
        const userLat = parseFloat(latParam);
        const userLng = parseFloat(lngParam);
        
        if (Number.isNaN(userLat) || Number.isNaN(userLng)) {
            return { statusCode: 400, headers, body: JSON.stringify({error: "Coordonnées invalides."}) };
        }
        
        const sql = neon(process.env.DATABASE_URL);
        
        // Récupère toutes les pharmacies géocodées avec le nom de leur zone
        const pharmacies = await sql`
            SELECT p.id as pharmacie_id, p.nom as pharmacie_nom, p.latitude, p.longitude, p.zone_id, z.nom as zone_nom
            FROM pharmacies p
            JOIN zones z ON p.zone_id = z.id
            WHERE p.latitude IS NOT NULL AND p.longitude IS NOT NULL
        `;
        
        if (pharmacies.length === 0) {
            return { statusCode: 200, headers, body: JSON.stringify({ zone_id: null, message: "Aucune pharmacie géocodée disponible pour référence." }) };
        }
        
        let closestPharma = null;
        let minDistance = Infinity;
        
        for (const p of pharmacies) {
            const dist = distanceKm(userLat, userLng, parseFloat(p.latitude), parseFloat(p.longitude));
            if (dist < minDistance) {
                minDistance = dist;
                closestPharma = p;
            }
        }
        
        const THRESHOLD_KM = 8.0; // Seuil de confiance proposé de 8 km
        
        if (minDistance <= THRESHOLD_KM) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    zone_id: closestPharma.zone_id,
                    zone_nom: closestPharma.zone_nom,
                    distanceKm: minDistance,
                    pharmacie_ref: closestPharma.pharmacie_nom
                })
            };
        } else {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    zone_id: null,
                    distanceKm: minDistance,
                    message: "La pharmacie la plus proche est trop éloignée (seuil de confiance dépassé)."
                })
            };
        }
        
    } catch(e) {
        console.error("Erreur detect-zone:", e.message);
        return { statusCode: 500, headers, body: JSON.stringify({error: "Erreur serveur", details: e.message}) };
    }
}
