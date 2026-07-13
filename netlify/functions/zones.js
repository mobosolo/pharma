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
        const zones = await sql`SELECT id, nom FROM zones ORDER BY id ASC`;
        return { statusCode: 200, headers, body: JSON.stringify(zones) };
    } catch(e) {
        return { statusCode: 500, headers, body: JSON.stringify({error: "Erreur serveur", details: e.message}) };
    }
}
