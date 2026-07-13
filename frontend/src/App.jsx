import { useState, useEffect, useCallback } from 'react';
import { SlidersHorizontal, WifiOff, RefreshCw, MapPinOff } from 'lucide-react';
import PharmacieCard from './components/PharmacieCard.jsx';
import SkeletonCard from './components/SkeletonCard.jsx';
import ZoneSheet from './components/ZoneSheet.jsx';
import Onboarding from './components/Onboarding.jsx';
import { requestPushSubscription } from './push-service';

const STORAGE_KEY_ZONE   = 'pharma_zone';
const STORAGE_KEY_DEVICE = 'pharma_device_id';
const STORAGE_KEY_CACHE  = 'pharma_cache';

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function getOrCreateDeviceId() {
  let id = localStorage.getItem(STORAGE_KEY_DEVICE);
  if (!id) { id = generateUUID(); localStorage.setItem(STORAGE_KEY_DEVICE, id); }
  return id;
}

export default function App() {
  const [zone, setZone]         = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_ZONE);
    return saved ? JSON.parse(saved) : null;
  });
  const [pharmacies, setPharmacies] = useState([]);
  const [gardeInfo, setGardeInfo]   = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [showSheet, setShowSheet]   = useState(false);
  const [zones, setZones]           = useState([]);
  const [cached, setCached]         = useState(null);

  // Chargement zones (pour le bottom-sheet)
  useEffect(() => {
    fetch('/.netlify/functions/zones').then(r => r.json()).then(setZones).catch(() => {});
  }, []);

  const fetchGardes = useCallback(async (z) => {
    if (!z) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/.netlify/functions/gardes-actuelle?zone_id=${z.id}`);
      if (!res.ok) throw new Error('Erreur réseau');
      const data = await res.json();
      setPharmacies(data.pharmacies || []);
      setGardeInfo(data.current);
      // Mise en cache locale
      const toCache = { pharmacies: data.pharmacies, current: data.current, ts: Date.now() };
      localStorage.setItem(STORAGE_KEY_CACHE + z.id, JSON.stringify(toCache));
      setCached(null);
    } catch (e) {
      setError(e.message);
      // Fallback cache
      const raw = localStorage.getItem(STORAGE_KEY_CACHE + z.id);
      if (raw) setCached(JSON.parse(raw));
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger au montage si une zone est déjà sauvegardée
  useEffect(() => {
    if (zone) fetchGardes(zone);
  }, [zone, fetchGardes]);

  const handleZoneSelected = async (z) => {
    localStorage.setItem(STORAGE_KEY_ZONE, JSON.stringify(z));
    setZone(z);

    const deviceId = getOrCreateDeviceId();
    
    // Demande l'autorisation et récupère le token push
    const pushToken = await requestPushSubscription();
    
    // Enregistrement de l'abonnement avec le token push
    fetch('/.netlify/functions/abonnements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        device_id: deviceId, 
        zone_id: z.id,
        pushToken: pushToken // Envoi du token (endpoint + keys)
      }),
    }).catch(() => {});
  };

  // Format date
  const todayLabel = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  const periodeLabel = gardeInfo
    ? `du ${new Date(gardeInfo.date_debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} au ${new Date(gardeInfo.date_fin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`
    : todayLabel;

  if (!zone) return <Onboarding onZoneSelected={handleZoneSelected} />;

  return (
    <div className="min-h-screen pb-10" style={{ background: 'var(--color-bg)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 px-5 pt-6 pb-4" style={{ background: 'var(--color-bg)' }}>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
              Pharmacies de garde
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
              {zone.nom} · {periodeLabel}
            </p>
          </div>
          <button
            onClick={() => setShowSheet(true)}
            className="mt-0.5 p-2 rounded-xl transition-colors"
            style={{ background: 'var(--color-surface)', color: 'var(--color-muted)' }}
            aria-label="Changer de zone"
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="px-5 flex flex-col gap-4">

        {/* État de chargement */}
        {loading && [1,2,3].map(i => <SkeletonCard key={i} />)}

        {/* Erreur réseau */}
        {!loading && error && (
          <div className="rounded-2xl p-6 flex flex-col items-center gap-4 text-center" style={{ background: 'var(--color-surface)' }}>
            <WifiOff size={32} style={{ color: 'var(--color-muted)' }} />
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Impossible de charger la liste.</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>Vérifiez votre connexion.</p>
            </div>
            <button
              onClick={() => fetchGardes(zone)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'var(--color-teal)' }}
            >
              <RefreshCw size={15} /> Réessayer
            </button>
          </div>
        )}

        {/* Cache affiché si erreur réseau */}
        {!loading && error && cached && cached.pharmacies.length > 0 && (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-center px-4" style={{ color: 'var(--color-muted)' }}>
              Dernière liste connue — mise à jour impossible
            </p>
            {cached.pharmacies.map(p => <PharmacieCard key={p.id} pharmacie={p} />)}
          </div>
        )}

        {/* Aucune pharmacie */}
        {!loading && !error && pharmacies.length === 0 && (
          <div className="rounded-2xl p-8 flex flex-col items-center gap-4 text-center" style={{ background: 'var(--color-surface)' }}>
            <MapPinOff size={32} style={{ color: 'var(--color-muted)' }} />
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                Aucune pharmacie de garde trouvée pour cette zone.
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                Essayez une autre zone ou revenez plus tard.
              </p>
            </div>
            <button
              onClick={() => setShowSheet(true)}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'var(--color-teal)' }}
            >
              Changer de zone
            </button>
          </div>
        )}

        {/* Liste des pharmacies */}
        {!loading && !error && pharmacies.map(p => (
          <PharmacieCard key={p.id} pharmacie={p} />
        ))}
      </div>

      {/* Footer discret */}
      <p className="text-center text-xs mt-8 px-6" style={{ color: 'var(--color-border)' }}>
        Source · Ordre National des Pharmaciens du Togo
        <br />
        <span style={{ color: 'var(--color-muted)' }}>Vérifiez par téléphone en cas d'urgence.</span>
      </p>

      {/* Bottom sheet changement de zone */}
      {showSheet && (
        <ZoneSheet
          zones={zones}
          selectedZone={zone}
          onSelect={handleZoneSelected}
          onClose={() => setShowSheet(false)}
        />
      )}
    </div>
  );
}
