# Pharmacies de Garde — Togo

Application web PWA qui liste les pharmacies de garde au Togo, avec géolocalisation, notifications push et carte interactive. Données issues du scraping quotidien de l'API de l'Ordre des Pharmaciens du Togo.

## Stack

**Frontend** — React 19 + Vite + Tailwind CSS 4 + Leaflet (carte) + Lucide (icônes)

**Backend** — Netlify Functions (scraper, API) + PostgreSQL (Neon) + PWA

**Scraper** — Netlify scheduled function (`@daily`) → API pharmaciens.tg → BDD

## Fonctionnalités

- **Géolocalisation** — tri automatique par distance, suivi continu de position
- **Carte interactive** — toutes les pharmacies géolocalisées sur une carte Leaflet
- **Sélection de zone** — filtre par secteur géographique (Lomé, Kara, etc.) ou toutes les zones
- **Notifications push** — alerte lors de la mise à jour de la liste des gardes
- **Mode hors-ligne** — cache local des dernières données consultées
- **Thème sombre** — adaptation automatique selon les préférences système
- **PWA** — installation sur l'écran d'accueil, fonctionnement en standalone
- **Itinéraire** — lien direct vers Google Maps depuis chaque pharmacie

## Structure

```
pharma-togo/
├── frontend/                 # App React (Vite)
│   ├── src/
│   │   ├── components/       # PharmacieCard, MapView, Onboarding, ZoneSheet
│   │   ├── utils/            # distance.js, geolocation.js
│   │   ├── App.jsx           # Layout principal
│   │   ├── index.css         # Design system (thème clair/sombre)
│   │   └── push-service.js   # Service worker PWA
│   ├── public/icons/         # Icônes PWA (SVG + PNG)
│   └── index.html
├── netlify/functions/        # Netlify Functions backend
│   ├── scraper.js            # Scraper quotidien (schedule @daily)
│   ├── gardes-actuelle.js    # API pharmacies par zone
│   ├── gardes-nationwide.js  # API toutes zones (avec période)
│   ├── zones.js              # Liste des zones
│   └── abonnements.js        # Gestion des abonnements push
├── db-init.js                # Schéma de la base de données
├── netlify.toml              # Configuration Netlify
└── .env                      # DATABASE_URL + clés VAPID
```

## Développement

```bash
# Frontend
cd frontend
npm install
npm run dev               # → http://localhost:5173

# Fonctions Netlify en local
npm install -g netlify-cli
netlify dev               # → http://localhost:8888
```

Le fichier `.env` à la racine doit contenir :

```
DATABASE_URL=postgresql://...
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
```

## Déploiement

Déploiement automatique Netlify. Les fonctions sont buildées via `@netlify/plugin-functions-install-core`. La BDD PostgreSQL est hébergée sur [Neon](https://neon.tech).

```bash
git push
# Netlify build & deploy automatique
```

## Base de données

Les pharmacies sont dédupliquées par **numéro de téléphone** (contrainte `UNIQUE`). Le scraper fait un upsert via `ON CONFLICT (telephone)` — les coordonnées GPS géocodées persistent entre les rotations de garde.

## Licence

MIT
