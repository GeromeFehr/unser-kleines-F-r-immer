'use client';
import { useEffect, useState } from 'react';
import { ImageIcon } from 'lucide-react';
export function MemoryPhoto({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  if (!src || failed) return <div className={'photo-fallback ' + className} role="img" aria-label={failed ? 'Foto nicht erreichbar' : 'Noch kein Foto'}><ImageIcon size={24} /><span>{failed ? 'Foto nicht erreichbar' : 'Platz für euren Moment'}</span></div>;
  return <img className={className} src={src} alt={alt || 'Foto dieser Erinnerung'} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(true)} />;
}
