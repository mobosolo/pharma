import { useState, useEffect, useCallback, useRef } from 'react';
import { SlidersHorizontal, WifiOff, RefreshCw, MapPinOff, Navigation, LoaderCircle, List, Map } from 'lucide-react';
import PharmacieCard from './components/PharmacieCard.jsx';
import SkeletonCard from './components/SkeletonCard.jsx';
import ZoneSheet from './components/ZoneSheet.jsx';
import Onboarding from './components/Onboarding.jsx';
import MapView from './components/MapView.jsx';
import { requestPushSubscription } from './push-service';
import { getUserLocation, getGeolocationErrorMessage } from './utils/geolocation';
import { sortPharmaciesByDistance, distanceKm } from './utils/distance';

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

  // Géolocalisation
  const [userLocation, setUserLocation]   = useState(null);
  const [locatingUser, setLocatingUser]   = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [viewMode, setViewMode]           = useState('list'); // 'list' | 'map'

  const lastLocationRef = useRef(null);
  const skipNextFetchRef = useRef(false);

  // Conserver la dernière position à jour pour comparaison dans le suivi continu
  useEffect(() => {
    lastLocationRef.current = userLocation;
  }, [userLocation]);

  // Suivi continu de la position
  useEffect(() => {
    if (!userLocation) return; // Seulement actif si géoloc déjà accordée
    
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const lastLoc = lastLocationRef.current;
        // Ne retrier que si déplacement significatif (> ~150m) pour éviter des recalculs inutiles
        if (!lastLoc || distanceKm(lastLoc.lat, lastLoc.lng, newLoc.lat, newLoc.lng) > 0.15) {
          setUserLocation(newLoc);
        }
      },
      (err) => console.warn('Suivi position interrompu:', err.message),
      { enableHighAccuracy: false, maximumAge: 30000 }
    );
    
    return () => navigator.geolocation.clearWatch(watchId);
  }, [userLocation === null]);

  // Chargement zones (pour le bottom-sheet)
  useEffect(() => {
    fetch('/.netlify/functions/zones').then(r => r.json()).then(setZones).catch(() => {});
  }, []);

  // Détection automatique au montage en mode national si la position n'est pas encore définie
  useEffect(() => {
    if (zone?.id === 'nationwide' && !userLocation && !locatingUser) {
      setLocatingUser(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocatingUser(false);
        },
        (err) => {
          setLocationError(getGeolocationErrorMessage(err));
          setLocatingUser(false);
        },
        { enableHighAccuracy: false, maximumAge: 30000 }
      );
    }
  }, [zone]);

  const fetchGardes = useCallback(async (z) => {
    if (!z) return;
    setLoading(true);
    setError(null);
    try {
      const url = z.id === 'nationwide'
        ? '/.netlify/functions/gardes-nationwide'
        : `/.netlify/functions/gardes-actuelle?zone_id=${z.id}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Erreur réseau');
      const data = await res.json();
      setPharmacies(data.pharmacies || []);
      setGardeInfo(data.current || null);
      const toCache = { pharmacies: data.pharmacies, current: data.current || null, ts: Date.now() };
      localStorage.setItem(STORAGE_KEY_CACHE + z.id, JSON.stringify(toCache));
      setCached(null);
    } catch (e) {
      setError(e.message);
      const raw = localStorage.getItem(STORAGE_KEY_CACHE + z.id);
      if (raw) setCached(JSON.parse(raw));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (zone) {
      if (skipNextFetchRef.current) {
        skipNextFetchRef.current = false;
        return;
      }
      fetchGardes(zone);
    }
  }, [zone, fetchGardes]);

  const handleZoneSelected = async (z, pushToken, initialLocation = null, initialPharmacies = null) => {
    localStorage.setItem(STORAGE_KEY_ZONE, JSON.stringify(z));
    setZone(z);
    
    if (initialLocation) {
      setUserLocation(initialLocation);
    } else {
      setUserLocation(null);
    }
    
    if (initialPharmacies) {
      setPharmacies(initialPharmacies);
      skipNextFetchRef.current = true;
    } else {
      setPharmacies([]);
    }
    
    setLocationError(null);
    setViewMode('list');

    const deviceId = getOrCreateDeviceId();
    const finalToken = pushToken || await requestPushSubscription().catch(() => null);

    fetch('/.netlify/functions/abonnements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        device_id: deviceId,
        zone_id: z.id === 'nationwide' ? null : z.id,
        pushToken: finalToken
      }),
    }).catch(() => {});
  };

  const handleLocateMe = async () => {
    setLocatingUser(true);
    setLocationError(null);
    try {
      const loc = await getUserLocation();
      setUserLocation(loc);
      // Basculer en mode nationwide (Toutes les zones)
      handleZoneSelected({ id: 'nationwide', nom: 'Toutes les zones' }, null, loc);
    } catch (e) {
      setLocationError(getGeolocationErrorMessage(e));
    } finally {
      setLocatingUser(false);
    }
  };

  const todayLabel = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  const periodeLabel = gardeInfo
    ? `du ${new Date(gardeInfo.date_debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} au ${new Date(gardeInfo.date_fin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`
    : todayLabel;

  if (!zone) return <Onboarding onZoneSelected={handleZoneSelected} />;

  const displayedPharmacies = userLocation
    ? sortPharmaciesByDistance(pharmacies, userLocation)
    : pharmacies;

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

        {/* Bouton géolocalisation ou Badge */}
        {userLocation ? (
          <div
            className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold w-max mx-auto border"
            style={{ borderColor: 'var(--color-teal)', color: 'var(--color-teal)', background: 'var(--color-surface)' }}
          >
            <span>📍</span> Position active
          </div>
        ) : (
          !loading && pharmacies.length > 0 && (
            <button
              onClick={handleLocateMe}
              disabled={locatingUser}
              className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium w-full justify-center"
              style={{ background: 'var(--color-surface)', color: 'var(--color-teal)' }}
            >
              {locatingUser ? <LoaderCircle size={16} className="animate-spin" /> : <Navigation size={16} />}
              {locatingUser ? 'Localisation en cours…' : 'Trier par proximité'}
            </button>
          )
        )}

        {locationError && (
          <p className="text-xs mt-2 text-center" style={{ color: 'var(--color-muted)' }}>
            {locationError}
          </p>
        )}

        {/* Bascule liste / carte */}
        {!loading && !error && pharmacies.length > 0 && (
          <div
            className="mt-3 flex rounded-xl p-1 gap-1"
            style={{ background: 'var(--color-surface)' }}
          >
            <button
              onClick={() => setViewMode('list')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: viewMode === 'list' ? 'var(--color-teal)' : 'transparent',
                color: viewMode === 'list' ? '#fff' : 'var(--color-muted)',
              }}
            >
              <List size={15} /> Liste
            </button>
            <button
              onClick={() => setViewMode('map')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: viewMode === 'map' ? 'var(--color-teal)' : 'transparent',
                color: viewMode === 'map' ? '#fff' : 'var(--color-muted)',
              }}
            >
              <Map size={15} /> Carte
            </button>
          </div>
        )}
      </div>

      {/* Contenu principal */}
      <div className="px-5 flex flex-col gap-4">

        {loading && [1,2,3].map(i => <SkeletonCard key={i} />)}

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

        {!loading && error && cached && cached.pharmacies.length > 0 && (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-center px-4" style={{ color: 'var(--color-muted)' }}>
              Dernière liste connue — mise à jour impossible
            </p>
            {cached.pharmacies.map(p => <PharmacieCard key={p.id} pharmacie={p} />)}
          </div>
        )}

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

        {!loading && !error && viewMode === 'map' && pharmacies.length > 0 && (
          <MapView pharmacies={displayedPharmacies} userLocation={userLocation} />
        )}

        {!loading && !error && viewMode === 'list' && displayedPharmacies.map(p => (
          <PharmacieCard key={p.id} pharmacie={p} />
        ))}
      </div>

      <p className="text-center text-xs mt-8 px-6" style={{ color: 'var(--color-border)' }}>
        Source · Ordre National des Pharmaciens du Togo
        <br />
        <span style={{ color: 'var(--color-muted)' }}>Vérifiez par téléphone en cas d'urgence.</span>
      </p>

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
