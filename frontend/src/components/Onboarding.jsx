import { useState, useEffect } from 'react';
import { MapPin, Navigation, LoaderCircle, ArrowRight } from 'lucide-react';
import { requestPushSubscription } from '../push-service';
import { getUserLocation } from '../utils/geolocation';

export default function Onboarding({ onZoneSelected }) {
  const [step, setStep]                 = useState('init'); // 'init' | 'detecting' | 'confirm' | 'manual'
  const [zones, setZones]               = useState([]);
  const [selected, setSelected]         = useState('');
  const [detectedZone, setDetectedZone] = useState(null);
  const [loading, setLoading]           = useState(false);

  // Charger les zones uniquement si on bascule en mode manuel
  const loadAllZones = async () => {
    if (zones.length > 0) return;
    setLoading(true);
    try {
      const r = await fetch('/.netlify/functions/zones');
      const data = await r.json();
      setZones(data);
      if (data.length > 0) setSelected(data[0].id);
    } catch (e) {
      console.error("Erreur de chargement des zones:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoDetect = async () => {
    setStep('detecting');
    try {
      const loc = await getUserLocation();
      const res = await fetch(`/.netlify/functions/detect-zone?lat=${loc.lat}&lng=${loc.lng}`);
      if (!res.ok) throw new Error('Erreur de détection');
      const data = await res.json();
      
      if (data.zone_id && data.zone_nom) {
        setDetectedZone({ id: data.zone_id, nom: data.zone_nom });
        setStep('confirm');
      } else {
        // Seuil dépassé ou pas de pharmacies de référence, fallback manuel
        await loadAllZones();
        setStep('manual');
      }
    } catch (e) {
      console.warn("Échec de la détection automatique, fallback manuel:", e.message);
      await loadAllZones();
      setStep('manual');
    }
  };

  const handleManualTransition = async () => {
    await loadAllZones();
    setStep('manual');
  };

  const handleConfirmContinue = async () => {
    if (!detectedZone) return;
    const pushToken = await requestPushSubscription();
    onZoneSelected(detectedZone, pushToken);
  };

  const handleManualContinue = async () => {
    const zone = zones.find(z => z.id == selected);
    if (!zone) return;
    const pushToken = await requestPushSubscription();
    onZoneSelected(zone, pushToken);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--color-bg)' }}>
      <div className="w-full max-w-sm rounded-3xl p-8 flex flex-col items-center gap-6" style={{ background: 'var(--color-surface)' }}>
        
        {/* Étape Initiale : Choix Détection ou Manuel */}
        {step === 'init' && (
          <>
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center animate-bounce"
              style={{ background: 'var(--color-teal)' }}
            >
              <Navigation size={28} color="white" strokeWidth={2.5} />
            </div>

            <div className="text-center">
              <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
                Trouvez vos pharmacies de garde
              </h1>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                Pour vous montrer instantanément les pharmacies de garde les plus proches au Togo.
              </p>
            </div>

            <button
              onClick={handleAutoDetect}
              className="w-full py-3.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all"
              style={{ background: 'var(--color-teal)' }}
            >
              <Navigation size={16} />
              Détecter ma zone
            </button>

            <button
              onClick={handleManualTransition}
              className="text-xs font-semibold hover:underline"
              style={{ color: 'var(--color-teal)' }}
            >
              Je préfère choisir manuellement
            </button>
          </>
        )}

        {/* Étape Détection en cours */}
        {step === 'detecting' && (
          <>
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--color-teal)' }}
            >
              <LoaderCircle size={28} color="white" strokeWidth={2.5} className="animate-spin" />
            </div>

            <div className="text-center">
              <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
                Détection de votre zone...
              </h1>
              <p className="text-sm leading-relaxed animate-pulse" style={{ color: 'var(--color-muted)' }}>
                Recherche de la pharmacie de repère la plus proche de votre position.
              </p>
            </div>
          </>
        )}

        {/* Étape Confirmation de zone détectée */}
        {step === 'confirm' && detectedZone && (
          <>
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--color-teal)' }}
            >
              <MapPin size={28} color="white" strokeWidth={2.5} />
            </div>

            <div className="text-center">
              <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
                Zone identifiée !
              </h1>
              <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--color-muted)' }}>
                Vous semblez être dans le secteur :
              </p>
              <div 
                className="inline-block px-4 py-2.5 rounded-xl font-bold text-sm border"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
              >
                {detectedZone.nom}
              </div>
            </div>

            <button
              onClick={handleConfirmContinue}
              className="w-full py-3.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all"
              style={{ background: 'var(--color-teal)' }}
            >
              Continuer <ArrowRight size={16} />
            </button>

            <button
              onClick={handleManualTransition}
              className="text-xs font-semibold hover:underline"
              style={{ color: 'var(--color-muted)' }}
            >
              Ce n'est pas ma zone, choisir manuellement
            </button>
          </>
        )}

        {/* Étape Sélection Manuelle (Fallback) */}
        {step === 'manual' && (
          <>
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--color-teal)' }}
            >
              <MapPin size={28} color="white" strokeWidth={2.5} />
            </div>

            <div className="text-center">
              <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
                Quelle est votre zone ?
              </h1>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                Sélectionnez manuellement votre secteur de résidence au Togo.
              </p>
            </div>

            {loading ? (
              <div className="w-full h-12 rounded-xl animate-pulse" style={{ background: 'var(--color-card)' }} />
            ) : (
              <select
                value={selected}
                onChange={e => setSelected(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm font-medium appearance-none cursor-pointer border"
                style={{
                  background: 'var(--color-card)',
                  color: 'var(--color-text)',
                  borderColor: 'var(--color-border)',
                  outline: 'none',
                }}
              >
                {zones.map(z => (
                  <option key={z.id} value={z.id}>{z.nom}</option>
                ))}
              </select>
            )}

            <button
              disabled={!selected || loading}
              onClick={handleManualContinue}
              className="w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
              style={{ background: 'var(--color-teal)' }}
            >
              Continuer
            </button>
          </>
        )}

      </div>
    </div>
  );
}
