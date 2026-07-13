import { neon } from '@neondatabase/serverless';

export const handler = async (event) => {
    const headers = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };
    
    // CORS Preflight
    if (event.httpMethod === "OPTIONS") {
        return { statusCode: 204, headers: { ...headers, "Access-Control-Allow-Methods": "POST, PUT, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" }, body: "" };
    }
    
    if (event.httpMethod !== "POST" && event.httpMethod !== "PUT") {
        return { statusCode: 405, headers, body: JSON.stringify({error: "Method Not Allowed"}) };
    }
    
    try {
        const body = JSON.parse(event.body || '{}');
        const device_id = body.device_id || event.queryStringParameters?.device_id;
        const zone_id = body.zone_id;
        const push_data = body.pushToken; // ou payload complet plus tard
        
        if (!device_id) {
            return { statusCode: 400, headers, body: JSON.stringify({error: "Le paramètre device_id est manquant."}) };
        }
        if (!zone_id) {
            return { statusCode: 400, headers, body: JSON.stringify({error: "Le paramètre zone_id est manquant."}) };
        }
        
        // Regex de validation UUID stricte
        const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
        if (!uuidRegex.test(device_id)) {
            return { statusCode: 400, headers, body: JSON.stringify({error: "Format device_id invalide (UUID v4 requis)."}) };
        }
        
        const sql = neon(process.env.DATABASE_URL);
        
        // Validation zone
        const checkZone = await sql`SELECT id FROM zones WHERE id = ${zone_id}`;
        if (checkZone.length === 0) {
            return { statusCode: 404, headers, body: JSON.stringify({error: "Zone introuvable."}) };
        }
        
        let endpoint = null, keys_p256dh = null, keys_auth = null;
        if (push_data && push_data.endpoint) {
            endpoint = push_data.endpoint;
            keys_p256dh = push_data.keys?.p256dh;
            keys_auth = push_data.keys?.auth;
        }
        
        // Logique "Upsert" (Création ou Mise à jour)
        await sql`
            INSERT INTO abonnements (device_id, zone_id, endpoint, keys_p256dh, keys_auth)
            VALUES (${device_id}, ${zone_id}, ${endpoint}, ${keys_p256dh}, ${keys_auth})
            ON CONFLICT (device_id) DO UPDATE SET
               zone_id = EXCLUDED.zone_id,
               endpoint = COALESCE(EXCLUDED.endpoint, abonnements.endpoint),
               keys_p256dh = COALESCE(EXCLUDED.keys_p256dh, abonnements.keys_p256dh),
               keys_auth = COALESCE(EXCLUDED.keys_auth, abonnements.keys_auth)
        `;
        
        return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: "Abonnement enregistré avec succès." }) };
    } catch(e) {
        return { statusCode: 500, headers, body: JSON.stringify({error: "Erreur serveur", details: e.message}) };
    }
}
