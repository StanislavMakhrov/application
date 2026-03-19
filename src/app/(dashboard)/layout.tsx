import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { DashboardNav } from '@/components/DashboardNav';

/**
 * Protected dashboard layout.
 * Verifies the JWT session cookie before rendering children.
 * Unauthenticated requests are redirected to /login.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen bg-green-50">
      <DashboardNav />
      <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
