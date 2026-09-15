import { requireChatGPTUser } from './chatgpt-auth';
import { Dashboard } from '@/components/forever/dashboard';
export const dynamic = 'force-dynamic';
export default async function Home() {
  await requireChatGPTUser('/');
  return <Dashboard />;
}
