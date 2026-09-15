import { Heart, Settings2, ArrowLeft } from 'lucide-react';
import type { CoupleSettings } from '@/lib/forever/types';
export function Header({ settings, admin = false, isAdmin = false }: { settings: CoupleSettings; admin?: boolean; isAdmin?: boolean }) {
  return <header className="site-header"><div className="header-inner">
    <a className="brand" href="/" aria-label="Unser kleines Für immer – Startseite"><span className="brand-mark"><Heart size={23} strokeWidth={1.5} /></span><span><strong>Für immer.</strong><small>{settings.firstName} & {settings.secondName}</small></span></a>
    <nav aria-label="Hauptnavigation">{admin ? <a className="nav-link back-link" href="/"><ArrowLeft size={17} />Zurück zu uns</a> : <><a className="nav-link home-link" href="#zuhause">Unser Zuhause</a><a className="nav-link" href="#erinnerungen">Unsere Orte</a></>}{isAdmin && !admin && <a className="admin-link" href="/admin" aria-label="Erinnerungen verwalten"><Settings2 size={17} /><span>Verwalten</span></a>}</nav>
  </div></header>;
}
