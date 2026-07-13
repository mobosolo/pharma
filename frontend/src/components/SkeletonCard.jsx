// Composant carte squelette animée (état de chargement)
export default function SkeletonCard() {
  return (
    <div className="rounded-2xl p-5" style={{ background: 'var(--color-card)' }}>
      <div className="skeleton h-5 w-3/4 mb-2" />
      <div className="skeleton h-4 w-1/2 mb-4" />
      <div className="skeleton h-11 w-full rounded-xl" />
    </div>
  );
}
