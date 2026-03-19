import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';

/**
 * Root page: redirect authenticated users to the dashboard, others to login.
 */
export default async function Home() {
  const user = await getUser();
  if (user) {
    redirect('/onboarding');
  }
  redirect('/login');
}
