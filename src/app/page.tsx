import { redirect } from 'next/navigation';

/**
 * Root page — redirects immediately to the dashboard.
 * GrünBilanz has no authentication: the app opens directly to the dashboard.
 */
export default function Home() {
  redirect('/dashboard');
}
