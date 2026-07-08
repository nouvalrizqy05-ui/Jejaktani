export default function TrustStars({ rataRata, jumlah, size = 'sm' }) {
  if (!rataRata) {
    return <span className="text-xs text-stone-400">Belum ada ulasan</span>;
  }
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  return (
    <span className={`inline-flex items-center gap-1 ${textSize} font-medium text-harvest-700`}>
      <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 1.5l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.2-5.4 3.2 1.3-6-4.6-4.1 6.1-.6z" />
      </svg>
      {rataRata.toFixed(1)}
      {jumlah ? <span className="text-stone-400 font-normal">({jumlah})</span> : null}
    </span>
  );
}
