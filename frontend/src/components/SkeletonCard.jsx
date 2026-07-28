export default function SkeletonCard() {
  return (
    <div className="card p-4" style={{ animation: 'none' }}>
      <div className="skeleton h-5 w-3/4 mb-2" />
      <div className="skeleton h-3.5 w-1/2 mb-4" />
      <div className="skeleton h-11 w-full rounded-xl" />
    </div>
  );
}
