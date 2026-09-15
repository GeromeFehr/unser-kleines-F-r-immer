import { requireAdmin } from '@/lib/forever/auth';
import { AdminPanel } from '@/components/forever/admin-panel';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Unsere Erinnerungen verwalten · Für immer' };
export default async function AdminPage() { await requireAdmin(); return <AdminPanel />; }
