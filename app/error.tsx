'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="access-state"><h1>Eine kleine Pause.</h1><p>Die Seite konnte gerade nicht vollständig geladen werden. Bitte versuche es erneut.</p><button onClick={reset}>Erneut versuchen</button><a href="/">Zur Startseite</a></main>;
}
