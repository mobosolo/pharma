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
        const sql = neon(process.env.DATABASE_URL);
        // On récupère toutes les pharmacies actuellement de garde, toutes zones confondues.
        const result = await sql`
            SELECT p.id, p.nom, p.telephone, p.adresse, p.latitude, p.longitude, p.zone_id, z.nom as zone_nom, g.date_debut, g.date_fin
            FROM gardes g
            JOIN pharmacies_gardes pg ON g.id = pg.garde_id
            JOIN pharmacies p ON pg.pharmacie_id = p.id
            JOIN zones z ON p.zone_id = z.id
            WHERE g.date_fin >= CURRENT_DATE 
            AND g.date_debut <= (CURRENT_DATE + INTERVAL '1 day')
            ORDER BY z.nom ASC, p.nom ASC
            LIMIT 500
        `;
        
        return { 
            statusCode: 200, 
            headers, 
            body: JSON.stringify({ 
                pharmacies: result 
            }) 
        };
    } catch(e) {
        console.error("Erreur gardes-nationwide:", e.message);
        return { statusCode: 500, headers, body: JSON.stringify({error: "Erreur serveur", details: e.message}) };
    }
}
