import fs from 'fs';
import webpush from 'web-push';

const keys = webpush.generateVAPIDKeys();

// Append aux variables d'environnement locales
const envUpdate = `\n# Web Push VAPID\nVAPID_PUBLIC_KEY=${keys.publicKey}\nVAPID_PRIVATE_KEY=${keys.privateKey}\n`;
fs.appendFileSync('.env', envUpdate);

console.log("Clés VAPID générées avec succès.");
console.log("VAPID_PUBLIC_KEY (à fournir au frontend) :", keys.publicKey);
