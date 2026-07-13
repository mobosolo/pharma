import { neon } from '@neondatabase/serverless';

export const handler = async (event) => {
    const headers = { 
        "Content-Type": "application/json", 
        "Access-Control-Allow-Origin": "*" 
    };
    
    if (event.httpMethod !== "GET") {
        return { statusCode: 405, headers, body: JSON.stringify({error: "Method Not Allowed"}) };
    }
    
    const zoneIdRaw = event.queryStringParameters?.zone_id;
    if (!zoneIdRaw) {
        return { 
            statusCode: 400, 
            headers, 
            body: JSON.stringify({error: "Le paramètre zone_id est obligatoire."}) 
        };
    }
    
    const zoneId = parseInt(zoneIdRaw, 10);
    if (isNaN(zoneId)) {
        return { 
            statusCode: 400, 
            headers, 
            body: JSON.stringify({error: "Le paramètre zone_id doit être un nombre."}) 
        };
    }
    
    try {
        console.log(`Fetching gardes for zoneId: ${zoneId}`);
        const sql = neon(process.env.DATABASE_URL);
        
        // 1. Validation de l'existence de la zone
        const checkZone = await sql`SELECT id FROM zones WHERE id = ${zoneId}`;
        if (checkZone.length === 0) {
            return { statusCode: 404, headers, body: JSON.stringify({error: "Zone introuvable."}) };
        }
        
        // 2. Extraction de la garde actuelle
        // On prend la garde contenant la date du jour
        const today = new Date().toISOString().split('T')[0];
        const gardes = await sql`
            SELECT id, date_debut, date_fin 
            FROM gardes 
            WHERE date_debut <= ${today} AND date_fin >= ${today}
            ORDER BY id DESC LIMIT 1
        `;
        
        // Fallback: Si l'Ordre des Pharmaciens est en retard de publication, 
        // on renvoie la garde la plus récente globalement pour ne pas planter l'application en erreur
        let activeGarde;
        if (gardes.length === 0) {
            const fallback = await sql`SELECT id, date_debut, date_fin FROM gardes ORDER BY id DESC LIMIT 1`;
            if (fallback.length === 0) {
                 return { statusCode: 200, headers, body: JSON.stringify({ current: null, pharmacies: [] }) };
            }
            activeGarde = fallback[0];
        } else {
            activeGarde = gardes[0];
        }
        
        // 3. Extraction des pharmacies liées à la zone pour cette garde
        const pharmacies = await sql`
            SELECT p.id, p.nom, p.telephone, p.adresse, p.assurances, p.horaires
            FROM pharmacies p
            JOIN pharmacies_gardes pg ON p.id = pg.pharmacie_id
            WHERE pg.garde_id = ${activeGarde.id} AND p.zone_id = ${zoneId}
            ORDER BY p.nom ASC
        `;
        
        return { 
            statusCode: 200, 
            headers, 
            body: JSON.stringify({ current: activeGarde, pharmacies }) 
        };
    } catch(e) {
        return { statusCode: 500, headers, body: JSON.stringify({error: "Erreur serveur", details: e.message}) };
    }
}
