import { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { requestPushSubscription } from '../push-service';

export default function Onboarding({ onZoneSelected }) {
  const [zones, setZones] = useState([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/.netlify/functions/zones')
      .then(r => r.json())
      .then(data => {
        setZones(data);
        if (data.length > 0) setSelected(data[0].id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleContinue = async () => {
    const zone = zones.find(z => z.id == selected);
    if (!zone) return;

    // Demande l'autorisation des notifications avant de continuer
    // Cela assure que l'appel est lié à un geste utilisateur (clic)
    const pushToken = await requestPushSubscription();

    onZoneSelected(zone, pushToken);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--color-bg)' }}>
      <div className="w-full max-w-sm rounded-3xl p-8 flex flex-col items-center gap-6" style={{ background: 'var(--color-surface)' }}>
        
        {/* Icône */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: 'var(--color-teal)' }}
        >
          <MapPin size={28} color="white" strokeWidth={2.5} />
        </div>

        {/* Texte */}
        <div className="text-center">
          <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
            Quelle est votre zone ?
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
            On vous montrera les pharmacies de garde proches de chez vous
          </p>
        </div>

        {/* Sélecteur */}
        {loading ? (
          <div className="skeleton w-full h-12 rounded-xl" />
        ) : (
          <select
            value={selected}
            onChange={e => setSelected(e.target.value)}
            className="w-full rounded-xl px-4 py-3 text-sm font-medium appearance-none cursor-pointer"
            style={{
              background: 'var(--color-card)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
              outline: 'none',
            }}
          >
            {zones.map(z => (
              <option key={z.id} value={z.id}>{z.nom}</option>
            ))}
          </select>
        )}

        {/* Bouton */}
        <button
          disabled={!selected || loading}
          onClick={handleContinue}
          className="w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
          style={{ background: 'var(--color-teal)' }}
        >
          Continuer
        </button>
      </div>
    </div>
  );
}
