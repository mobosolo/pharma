import { Phone, MapPin, Navigation } from 'lucide-react';
import { formatDistance } from '../utils/distance';

export default function PharmacieCard({ pharmacie, index = 0 }) {
  const tel = pharmacie.telephone || '';
  const telLink = tel.replace(/\s/g, '');

  const hasCoords = pharmacie.latitude !== null && pharmacie.latitude !== undefined &&
                    pharmacie.longitude !== null && pharmacie.longitude !== undefined;
  const lat = hasCoords ? parseFloat(pharmacie.latitude) : null;
  const lng = hasCoords ? parseFloat(pharmacie.longitude) : null;

  return (
    <div
      className="card p-4 flex flex-col gap-3.5 fade-in"
      style={{ animationDelay: `${index * 40}ms`, animationFillMode: 'both' }}
    >
      {/* En-tête : nom + badge distance */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-[15px] font-semibold leading-snug tracking-tight" style={{ color: 'var(--color-text)' }}>
            {pharmacie.nom}
          </h2>
          {pharmacie.distanceKm !== null && pharmacie.distanceKm !== undefined && (
            <span
              className="flex items-center gap-1 text-[12px] font-semibold shrink-0 px-2.5 py-1 rounded-full"
              style={{ color: '#fff', background: 'var(--color-teal)' }}
            >
              <MapPin size={11} fill="rgba(255,255,255,0.3)" />
              {formatDistance(pharmacie.distanceKm)}
            </span>
          )}
        </div>
        {pharmacie.adresse && (
          <p className="text-[13px] mt-1 leading-relaxed" style={{ color: 'var(--color-muted)' }}>
            {pharmacie.adresse}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2.5">
        {telLink ? (
          <a
            href={`tel:${telLink}`}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-semibold text-white active:scale-[0.97]"
            style={{ background: 'var(--color-teal)', transition: 'transform 0.1s ease' }}
          >
            <Phone size={17} strokeWidth={2.5} />
            Appeler
          </a>
        ) : (
          <span
            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-medium"
            style={{ color: 'var(--color-muted)', background: 'var(--color-border-soft)' }}
          >
            <Phone size={16} strokeWidth={2} />
            Numéro indisponible
          </span>
        )}

        {hasCoords && (
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 rounded-xl py-3 px-4 text-[14px] font-semibold active:scale-[0.97]"
            style={{
              border: '1.5px solid var(--color-teal)',
              color: 'var(--color-teal)',
              background: 'transparent',
              transition: 'transform 0.1s ease',
            }}
          >
            <Navigation size={16} strokeWidth={2.5} />
            <span className="hidden sm:inline">Itinéraire</span>
          </a>
        )}
      </div>
    </div>
  );
}
