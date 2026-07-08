export default function Logo({ size = 36, withText = true, dark = false }) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <svg width={size} height={size} viewBox="0 0 200 200" className="shrink-0">
        <rect width="200" height="200" rx="46" fill="#0d9488" />
        <path d="M32 60 L32 32 L60 32" stroke="#fff" strokeWidth="10" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M140 32 L168 32 L168 60" stroke="#fff" strokeWidth="10" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M168 140 L168 168 L140 168" stroke="#fff" strokeWidth="10" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M60 168 L32 168 L32 140" stroke="#fff" strokeWidth="10" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M100 58 C128 66 138 96 118 124 C100 148 78 140 72 114 C67 90 78 64 100 58 Z" fill="#4ade80" />
        <path d="M100 124 L100 146" stroke="#4ade80" strokeWidth="8" strokeLinecap="round" />
      </svg>
      {withText && (
        <span className={`font-display font-semibold tracking-tight text-xl ${dark ? 'text-white' : 'text-stone-900'}`}>
          Jejak Tani
        </span>
      )}
    </div>
  );
}
