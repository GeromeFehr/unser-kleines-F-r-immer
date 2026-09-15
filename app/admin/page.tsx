import { requireChatGPTUser } from '@/app/chatgpt-auth';
import { isAdmin } from '@/lib/forever/server';
import { AdminPanel } from '@/components/forever/admin-panel';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Unsere Erinnerungen verwalten · Für immer' };
export default async function AdminPage() {
  const user = await requireChatGPTUser('/admin');
  let allowed = false;
  try { allowed = await isAdmin(user); }
  catch { return <main className="access-state"><h1>Eine kleine Pause.</h1><p>Die Verwaltung ist gerade nicht erreichbar. Bitte versuche es gleich noch einmal.</p><a href="/admin">Erneut versuchen</a><a href="/">Zurück zu uns</a></main>; }
  if (!allowed) return <main className="access-state"><h1>Dieser Bereich ist für Gérôme.</h1><p>Hier werden eure Erinnerungen gepflegt. Auf eurer Startseite kannst du sie alle ansehen.</p><a href="/">Zurück zu uns</a><a href="/signout-with-chatgpt?return_to=%2Fadmin" target="_top">Mit anderem Konto anmelden</a></main>;
  return <AdminPanel />;
}
