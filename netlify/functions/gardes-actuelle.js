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
        const result = await sql`
            SELECT g.id, g.date_debut, g.date_fin, p.id, p.nom, p.telephone, p.adresse, p.assurances, p.horaires, p.latitude, p.longitude
            FROM gardes g
            JOIN pharmacies_gardes pg ON g.id = pg.garde_id
            JOIN pharmacies p ON pg.pharmacie_id = p.id
            WHERE g.date_fin >= CURRENT_DATE 
            AND g.date_debut <= (CURRENT_DATE + INTERVAL '1 day')
            AND p.zone_id = ${zone_id}
            ORDER BY g.date_debut DESC
            LIMIT 100
        `;
        
        const currentGarde = await sql`SELECT id, date_debut, date_fin FROM gardes WHERE date_fin >= CURRENT_DATE ORDER BY date_debut DESC LIMIT 1`;
        
        return { 
            statusCode: 200, 
            headers, 
            body: JSON.stringify({ 
                current: currentGarde[0] || null, 
                pharmacies: result 
            }) 
        };
    } catch(e) {
        return { statusCode: 500, headers, body: JSON.stringify({error: "Erreur serveur", details: e.message}) };
    }
}
