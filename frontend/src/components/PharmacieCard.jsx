import { Phone, MapPin } from 'lucide-react';
import { formatDistance } from '../utils/distance';

export default function PharmacieCard({ pharmacie }) {
  const tel = pharmacie.telephone || '';
  const telLink = tel.replace(/\s/g, '');

  const hasCoords = pharmacie.latitude !== null && pharmacie.latitude !== undefined &&
                    pharmacie.longitude !== null && pharmacie.longitude !== undefined;
  const lat = hasCoords ? parseFloat(pharmacie.latitude) : null;
  const lng = hasCoords ? parseFloat(pharmacie.longitude) : null;

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3"
      style={{ background: 'var(--color-card)' }}
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-base font-bold leading-snug" style={{ color: 'var(--color-text)' }}>
            {pharmacie.nom}
          </h2>
          {pharmacie.distanceKm !== null && pharmacie.distanceKm !== undefined && (
            <span
              className="flex items-center gap-1 text-xs font-semibold shrink-0 px-2 py-1 rounded-lg"
              style={{ color: 'var(--color-teal)', background: 'var(--color-bg)' }}
            >
              <MapPin size={12} />
              {formatDistance(pharmacie.distanceKm)}
            </span>
          )}
        </div>
        {pharmacie.adresse && (
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted)' }}>
            {pharmacie.adresse}
          </p>
        )}
      </div>

      <div className="flex gap-3">
        {telLink ? (
          <a
            href={`tel:${telLink}`}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-colors"
            style={{ background: 'var(--color-teal)' }}
            onMouseOver={e => e.currentTarget.style.background = 'var(--color-teal-hover)'}
            onMouseOut={e => e.currentTarget.style.background = 'var(--color-teal)'}
          >
            <Phone size={17} strokeWidth={2.5} />
            Appeler
          </a>
        ) : (
          <span className="flex-1 text-sm text-center py-3 rounded-xl" style={{ color: 'var(--color-muted)', background: 'var(--color-border)' }}>
            Numéro indisponible
          </span>
        )}

        {hasCoords && (
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold border transition-colors"
            style={{ borderColor: 'var(--color-teal)', color: 'var(--color-teal)', background: 'transparent' }}
            onMouseOver={e => {
              e.currentTarget.style.background = 'var(--color-teal)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--color-teal)';
            }}
          >
            <MapPin size={17} strokeWidth={2.5} />
            Itinéraire
          </a>
        )}
      </div>
    </div>
  );
}