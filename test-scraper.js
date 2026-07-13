import 'dotenv/config';
import { handler } from './netlify/functions/scraper.js';

// Fonction mock d'événement request Netlify (qui n'est pas vraiment utilisé de toutes facons par schedule("@daily"))
async function test() {
    console.log("Lancement du test...");
    const res = await handler({});
    console.log("Retour de la fonction Netlify:", res);
}
test().catch(console.error);
