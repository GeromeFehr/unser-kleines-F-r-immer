'use client';
import { useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Heart, LoaderCircle, LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { requestJson } from '@/lib/forever/client';

export function LoginForm({ configured, returnTo }: { configured: boolean; returnTo: string }) {
  const [password, setPassword] = useState(''), [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError('');
    try {
      const result = await requestJson<{ returnTo: string }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ password, returnTo }) });
      window.location.assign(result.returnTo);
    } catch (e) { setError(e instanceof Error ? e.message : 'Bitte versuche es noch einmal.'); setBusy(false); }
  }
  return <main className="login-page">
    <a className="login-brand" href="/"><Heart size={23} strokeWidth={1.5} /> Für immer.</a>
    <section className="login-card" aria-labelledby="login-title">
      <div className="login-lock"><LockKeyhole size={26} strokeWidth={1.5} /></div>
      <p className="eyebrow">UNSER KLEINES FÜR IMMER</p>
      <h1 id="login-title">Willkommen<br /><em>zurück.</em></h1>
      <p className="login-intro">{returnTo === '/admin' ? 'Ein Passwort. Und Platz für all die Momente, die bleiben.' : 'Euer kleiner, ganz persönlicher Ort. Öffne ihn mit eurem Passwort.'}</p>
      {configured ? <form onSubmit={submit}>
        <label htmlFor="password">{returnTo === '/admin' ? 'Admin-Passwort' : 'Euer Passwort'}</label>
        <div className="password-field"><input id="password" name="password" type={visible ? 'text' : 'password'} autoComplete="current-password" required maxLength={1024} value={password} onChange={e => setPassword(e.target.value)} placeholder="Dein Passwort" aria-describedby={error ? 'login-error' : undefined} disabled={busy} />
          <button type="button" aria-label={visible ? 'Passwort verbergen' : 'Passwort anzeigen'} aria-pressed={visible} onClick={() => setVisible(v => !v)}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
        {error && <p className="login-error" id="login-error" role="alert">{error}</p>}
        <Button className="login-submit" type="submit" disabled={busy}>{busy ? <><LoaderCircle className="spin" size={18} /> Einen Moment …</> : <>{returnTo === '/admin' ? 'Erinnerungen verwalten' : 'Unser Zuhause öffnen'}<ArrowRight size={17} /></>}</Button>
        <p className="login-hint">{returnTo === '/admin' ? 'Nur für eure Erinnerungen. Kein weiteres Konto nötig.' : 'Schön, dass du da bist. ♡'}</p>
      </form> : <div className="login-setup" role="status"><strong>Einmal einrichten, dann loslegen.</strong><p>Lege in den Umgebungsvariablen deines Netlify-Projekts <code>ADMIN_PASSWORD</code> mit einem eigenen Passwort aus mindestens 12 Zeichen an und starte den Deploy erneut.</p><p>Danach kannst du dich direkt hier anmelden.</p></div>}
      <a className="login-back" href="/"><ArrowLeft size={15} /> Zurück zu uns</a>
    </section>
    <p className="login-caption">Die schönsten Geschichten schreiben wir zusammen. ♡</p>
  </main>;
}
