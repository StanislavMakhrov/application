import { redirect } from 'next/navigation';
import { createSupabaseServerClient, isDemoMode } from '@/lib/supabase';
import { DashboardNav } from '@/components/DashboardNav';

/**
 * Protected dashboard layout.
 * Verifies authentication before rendering children.
 * In demo mode (no Supabase credentials), shows a demo banner instead of redirecting.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Demo mode: no Supabase credentials configured
  if (isDemoMode) {
    return (
      <div className="min-h-screen bg-green-50">
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
          <p className="text-amber-800 text-sm text-center">
            <strong>Demo-Modus aktiv:</strong> Keine Datenbankzugangsdaten konfiguriert.
            Bitte konfigurieren Sie die Supabase-Umgebungsvariablen für den Vollbetrieb.
          </p>
        </div>
        <DashboardNav demoMode />
        <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
      </div>
    );
  }

  // Verify authentication
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    redirect('/login');
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-green-50">
      <DashboardNav />
      <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
