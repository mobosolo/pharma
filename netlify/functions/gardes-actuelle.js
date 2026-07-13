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
            SELECT g.id, g.date_debut, g.date_fin, p.id, p.nom, p.telephone, p.adresse, p.assurances, p.horaires
            FROM gardes g
            JOIN pharmacies_gardes pg ON g.id = pg.garde_id
            JOIN pharmacies p ON pg.pharmacie_id = p.id
            WHERE g.id = (SELECT id FROM gardes WHERE date_debut <= NOW() AND date_fin >= NOW() LIMIT 1)
            AND p.zone_id = ${zone_id}
        `;
        
        // On reformate pour correspondre à l'ancien format
        const pharmacies = result.map(r => ({
            id: r.id,
            nom: r.nom,
            telephone: r.telephone,
            adresse: r.adresse,
            assurances: r.assurances,
            horaires: r.horaires
        }));
        
        // On récupère la période actuelle
        const currentGarde = await sql`SELECT id, date_debut, date_fin FROM gardes WHERE date_debut <= NOW() AND date_fin >= NOW() LIMIT 1`;
        
        return { 
            statusCode: 200, 
            headers, 
            body: JSON.stringify({ 
                current: currentGarde[0] || null, 
                pharmacies: pharmacies 
            }) 
        };
    } catch(e) {
        return { statusCode: 500, headers, body: JSON.stringify({error: "Erreur serveur", details: e.message}) };
    }
}
