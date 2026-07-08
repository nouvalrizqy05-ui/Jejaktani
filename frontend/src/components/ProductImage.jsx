/**
 * ProductImage — renders a real photo if foto_emoji is a URL, 
 * otherwise falls back to emoji text display.
 */
export default function ProductImage({ src, alt = 'Produk', className = '', size = 'md' }) {
  const isUrl = src && (src.startsWith('http') || src.startsWith('/'));
  
  const sizeClasses = {
    xs: 'w-10 h-10',
    sm: 'w-12 h-12', 
    md: 'w-14 h-14',
    lg: 'w-full h-full',
    hero: 'w-full aspect-square',
  };

  if (isUrl) {
    return (
      <img 
        src={src} 
        alt={alt} 
        loading="lazy"
        className={`object-cover ${sizeClasses[size] || ''} ${className}`} 
      />
    );
  }

  // Fallback: emoji
  const emojiSizes = { xs: 'text-xl', sm: 'text-2xl', md: 'text-3xl', lg: 'text-6xl', hero: 'text-9xl' };
  return (
    <span className={`${emojiSizes[size] || 'text-3xl'} ${className}`}>
      {src || '🥬'}
    </span>
  );
}
