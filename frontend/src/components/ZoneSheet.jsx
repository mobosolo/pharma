import { X } from 'lucide-react';

export default function ZoneSheet({ zones, selectedZone, onSelect, onClose }) {
  return (
    // Overlay semi-transparent
    <div
      className="fixed inset-0 flex flex-col justify-end z-50"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      {/* Bottom sheet */}
      <div
        className="slide-up rounded-t-3xl p-6 w-full max-h-[80vh] overflow-y-auto"
        style={{ background: 'var(--color-surface)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
            Changer de zone
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full"
            style={{ color: 'var(--color-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {zones.map(z => (
            <button
              key={z.id}
              onClick={() => { onSelect(z); onClose(); }}
              className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors"
              style={{
                background: selectedZone?.id === z.id ? 'var(--color-teal)' : 'var(--color-card)',
                color: selectedZone?.id === z.id ? 'white' : 'var(--color-text)',
              }}
            >
              {z.nom}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
