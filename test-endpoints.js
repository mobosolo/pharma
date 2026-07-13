import 'dotenv/config';
import { handler as apiZones } from './netlify/functions/zones.js';
import { handler as apiGardes } from './netlify/functions/gardes-actuelle.js';
import { handler as apiAbos } from './netlify/functions/abonnements.js';

async function test() {
    console.log("=== GET /zones ===");
    let r1 = await apiZones({ httpMethod: "GET" });
    console.log(r1.statusCode, JSON.parse(r1.body).error || (JSON.parse(r1.body).length > 0 ? "OK" : "KO"));

    console.log("\n=== GET /gardes-actuelle (missing zone) ===");
    let r2 = await apiGardes({ httpMethod: "GET" });
    console.log(r2.statusCode, JSON.parse(r2.body).error);

    console.log("\n=== GET /gardes-actuelle?zone_id=1 ===");
    let r3 = await apiGardes({ httpMethod: "GET", queryStringParameters: { zone_id: 1 } });
    const b3 = JSON.parse(r3.body);
    console.log(r3.statusCode, b3.current ? "Garde récupérée!" : "Pas de garde", "Nombre pharmacies:", b3.pharmacies?.length);

    console.log("\n=== POST /abonnements (missing device_id) ===");
    let r4 = await apiAbos({ httpMethod: "POST", body: JSON.stringify({ zone_id: 1 }) });
    console.log(r4.statusCode, JSON.parse(r4.body).error);

    console.log("\n=== POST /abonnements (invalid UUID format) ===");
    let r5 = await apiAbos({ httpMethod: "POST", body: JSON.stringify({ device_id: "mon-super-telephone", zone_id: 1 }) });
    console.log(r5.statusCode, JSON.parse(r5.body).error);

    console.log("\n=== POST /abonnements (ok UUID) ===");
    let r6 = await apiAbos({ httpMethod: "POST", body: JSON.stringify({ device_id: "123e4567-e89b-12d3-a456-426614174000", zone_id: 1 }) });
    console.log(r6.statusCode, JSON.parse(r6.body).message);
    
    // Modification zone 2 (Upsert)
    console.log("\n=== PUT /abonnements (Upsert to zone 2) ===");
    let r7 = await apiAbos({ httpMethod: "PUT", body: JSON.stringify({ device_id: "123e4567-e89b-12d3-a456-426614174000", zone_id: 2 }) });
    console.log(r7.statusCode, JSON.parse(r7.body).message);
}
test().catch(console.error);
