import { requireViewer } from '@/lib/forever/auth';
import { Dashboard } from '@/components/forever/dashboard';
export const dynamic = 'force-dynamic';
export default async function Home() { await requireViewer(); return <Dashboard />; }
