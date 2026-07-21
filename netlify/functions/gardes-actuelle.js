const { neon } = require('@neondatabase/serverless');

exports.handler = async (event) => {
    const headers = { 
        "Content-Type": "application/json", 
        "Access-Control-Allow-Origin": "*" 
    };
    
    if (event.httpMethod !== "GET") {
        return { statusCode: 405, headers, body: JSON.stringify({error: "Method Not Allowed"}) };
    }
    
    try {
        const zone_id = event.queryStringParameters?.zone_id;
        if (!zone_id) {
            return { statusCode: 400, headers, body: JSON.stringify({error: "Le paramètre zone_id est obligatoire."}) };
        }
        const sql = neon(process.env.DATABASE_URL);
        
        // 1. Déterminer la garde unique actuelle
        const currentGarde = await sql`
            SELECT id, date_debut, date_fin 
            FROM gardes 
            WHERE date_fin >= CURRENT_DATE 
            ORDER BY date_debut DESC 
            LIMIT 1
        `;
        
        if (currentGarde.length === 0) {
            return { 
                statusCode: 200, 
                headers, 
                body: JSON.stringify({ 
                    current: null, 
                    pharmacies: [] 
                }) 
            };
        }
        
        // 2. Récupérer les pharmacies UNIQUEMENT liées à cette garde précise
        const result = await sql`
            SELECT p.id, p.nom, p.telephone, p.adresse, p.assurances, p.horaires, p.latitude, p.longitude
            FROM pharmacies_gardes pg
            JOIN pharmacies p ON pg.pharmacie_id = p.id
            WHERE pg.garde_id = ${currentGarde[0].id}
            AND p.zone_id = ${zone_id}
        `;
        
        return { 
            statusCode: 200, 
            headers, 
            body: JSON.stringify({ 
                current: currentGarde[0], 
                pharmacies: result 
            }) 
        };
    } catch(e) {
        return { statusCode: 500, headers, body: JSON.stringify({error: "Erreur serveur", details: e.message}) };
    }
}
