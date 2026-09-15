'use client';
import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { requestJson } from '@/lib/forever/client';
export function LogoutButton({ guard }: { guard?: (action: () => void) => void }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function logout() {
    setBusy(true); setError('');
    try { await requestJson('/api/auth/logout', { method: 'POST' }); window.location.assign('/'); }
    catch { setError('Abmelden fehlgeschlagen. Bitte erneut versuchen.'); setBusy(false); }
  }
  return <span className="logout-wrap"><button className="nav-link logout-button" type="button" disabled={busy} onClick={() => guard ? guard(() => { void logout(); }) : void logout()} aria-label="Abmelden"><LogOut size={16} /><span>{busy ? 'Einen Moment …' : 'Abmelden'}</span></button>{error && <span className="logout-error" role="alert">{error}</span>}</span>;
}
