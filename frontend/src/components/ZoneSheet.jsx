import { X, MapPin } from 'lucide-react';

export default function ZoneSheet({ zones, selectedZone, onSelect, onClose }) {
  return (
    <div
      className="fixed inset-0 flex flex-col justify-end z-50"
      style={{ background: 'rgba(0,0,0,0.65)' }}
      onClick={onClose}
    >
      <div
        className="slide-up rounded-t-3xl p-5 w-full max-h-[80vh] overflow-y-auto"
        style={{ background: 'var(--color-card)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Poignée */}
        <div className="flex justify-center mb-4">
          <div className="w-8 h-1 rounded-full" style={{ background: 'var(--color-border)' }}></div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
            Changer de zone
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--color-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {zones.map(z => {
            const isActive = selectedZone?.id === z.id;
            return (
              <button
                key={z.id}
                onClick={() => { onSelect(z); onClose(); }}
                className="w-full text-left px-4 py-3.5 rounded-xl text-[14px] font-semibold flex items-center gap-3 transition-all active:scale-[0.98]"
                style={{
                  background: isActive ? 'var(--color-teal)' : 'var(--color-bg)',
                  color: isActive ? '#fff' : 'var(--color-text)',
                  boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                  transition: 'transform 0.12s ease',
                }}
              >
                <MapPin size={15} strokeWidth={2} />
                {z.nom}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
