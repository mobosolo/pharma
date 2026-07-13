import 'dotenv/config';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { handler as apiZones } from './netlify/functions/zones.js';
import { handler as apiAbos } from './netlify/functions/abonnements.js';
import { handler as apiGardes } from './netlify/functions/gardes-actuelle.js';
import { handler as scraper } from './netlify/functions/scraper.js';

const parseBody = (req) => new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => resolve(body));
});

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const qs = Object.fromEntries(url.searchParams.entries());
    
    // Serveurs de fichiers statiques (pour tester frontend push)
    if (url.pathname === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        return res.end(fs.readFileSync(path.join(process.cwd(), 'public', 'index.html')));
    }
    if (url.pathname === '/sw.js') {
        res.writeHead(200, { 'Content-Type': 'application/javascript' });
        return res.end(fs.readFileSync(path.join(process.cwd(), 'public', 'sw.js')));
    }
    if (url.pathname === '/trigger-push') {
        // Exécute le scraper pour simuler une détection et envoyer les notifs !
        console.log("Exécution manuelle du scraper demandée par le JS local.");
        
        // On modifie legerement le hack : on s'assure qu'une notif part même si on a déjà enregistré la garde.
        // Mais puisqu'on veut un test réaliste, je fais un appel standard
        await scraper({}); 
        // Si c'etait deja dans la base, on drop la derniere garde pour simuler sa NOUVELLE insertion
        // Mais ce mock est suffisant.
        res.writeHead(200);
        return res.end(`Consultez la console du backend pour voir les logs d'exécution du hook push ! Note: Si aucune notification n'arrive, supprimez l'entrée de la table 'gardes' pour forcer l'insertion.`);
    }

    const event = {
        httpMethod: req.method,
        queryStringParameters: qs,
        body: await parseBody(req)
    };
    
    let func = null;
    if (url.pathname === '/.netlify/functions/zones') func = apiZones;
    else if (url.pathname === '/.netlify/functions/abonnements') func = apiAbos;
    else if (url.pathname === '/.netlify/functions/gardes-actuelle') func = apiGardes;
    else {
        res.writeHead(404);
        return res.end();
    }
    
    const result = await func(event);
    res.writeHead(result.statusCode, result.headers || {});
    res.end(result.body);
});

server.listen(9999, async () => {
    console.log("Serveur de Test local démarré sur http://localhost:9999 !");
    console.log("Ouvrez cette URL dans le navigateur pour tester l'abonnement et la réception VAPID !");
});
