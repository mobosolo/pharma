import { Phone } from 'lucide-react';

export default function PharmacieCard({ pharmacie }) {
  const tel = pharmacie.telephone || '';
  const telLink = tel.replace(/\s/g, '');

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3"
      style={{ background: 'var(--color-card)' }}
    >
      <div>
        <h2 className="text-base font-bold leading-snug" style={{ color: 'var(--color-text)' }}>
          {pharmacie.nom}
        </h2>
        {pharmacie.adresse && (
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted)' }}>
            {pharmacie.adresse}
          </p>
        )}
      </div>

      {telLink ? (
        <a
          href={`tel:${telLink}`}
          className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-colors"
          style={{ background: 'var(--color-teal)' }}
          onMouseOver={e => e.currentTarget.style.background = 'var(--color-teal-hover)'}
          onMouseOut={e => e.currentTarget.style.background = 'var(--color-teal)'}
        >
          <Phone size={17} strokeWidth={2.5} />
          Appeler
        </a>
      ) : (
        <span className="text-sm text-center py-3 rounded-xl" style={{ color: 'var(--color-muted)', background: 'var(--color-border)' }}>
          Numéro indisponible
        </span>
      )}
    </div>
  );
}
