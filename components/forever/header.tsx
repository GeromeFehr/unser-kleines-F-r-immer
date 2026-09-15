import { Heart, Settings2, ArrowLeft, MapPin } from 'lucide-react';
import type { CoupleSettings } from '@/lib/forever/types';
import { LogoutButton } from './logout-button';
import { ThemeToggle } from './theme-toggle';
export function Header({ settings, admin = false, isAdmin = false, guardLogout }: { settings: CoupleSettings; admin?: boolean; isAdmin?: boolean; guardLogout?: (action: () => void) => void }) {
  return <header className="site-header"><div className="header-inner">
    <a className="brand" href="/" aria-label="Unser kleines Für immer – Startseite"><span className="brand-mark"><Heart size={23} strokeWidth={1.5} /></span><span><strong>Für immer.</strong><small>{settings.firstName} & {settings.secondName}</small></span></a>
    <nav aria-label="Hauptnavigation">{admin ? <a className="nav-link back-link" href="/"><ArrowLeft size={17} />Zurück zu uns</a> : <><a className="nav-link home-link" href="#zuhause">Unser Zuhause</a><a className="nav-link places-link" href="#erinnerungen" aria-label="Unsere Orte"><MapPin size={17} /><span>Unsere Orte</span></a><a className="admin-link" href="/admin" aria-label="Erinnerungen verwalten"><Settings2 size={17} /><span>Verwalten</span></a></>}<ThemeToggle />{(admin || isAdmin) && <LogoutButton guard={guardLogout} />}</nav>
  </div></header>;
}
