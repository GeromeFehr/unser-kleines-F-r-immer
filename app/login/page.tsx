import { redirect } from 'next/navigation';
import { getSession } from '@/lib/forever/auth';
import { adminConfigured, safeReturnTo } from '@/lib/forever/password';
import { LoginForm } from '@/components/forever/login-form';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Willkommen zurück · Für immer' };
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const returnTo = safeReturnTo((await searchParams).returnTo);
  const session = await getSession();
  if (session?.role === 'admin' || (session && returnTo === '/')) redirect(returnTo);
  return <LoginForm configured={adminConfigured()} returnTo={returnTo} />;
}
