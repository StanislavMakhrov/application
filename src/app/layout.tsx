import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GrünBilanz – CO₂-Fußabdruck für Handwerksbetriebe',
  description:
    'CO₂-Bilanz und ESG-Berichterstattung für kleine und mittlere Handwerksbetriebe in Deutschland. GHG-Protokoll-konform, UBA-Emissionsfaktoren 2024.',
  keywords: ['CO₂-Bilanz', 'ESG', 'Handwerk', 'GHG-Protokoll', 'Emissionsrechner'],
};

/**
 * Root layout for GrünBilanz.
 * Sets German language, global metadata, and base styles.
 * No authentication — the app opens directly to the dashboard.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-gray-50">
        {/* Global navigation bar */}
        <nav className="bg-green-700 text-white shadow-md">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/dashboard" className="flex items-center gap-2 font-bold text-xl">
              <span className="text-green-200">Grün</span>
              <span className="text-white">Bilanz</span>
            </a>
            <div className="flex items-center gap-4 text-sm">
              <a href="/dashboard" className="hover:text-green-200 transition-colors">
                Dashboard
              </a>
              <a
                href="/input"
                className="bg-white text-green-700 px-3 py-1.5 rounded-md font-semibold hover:bg-green-50 transition-colors"
              >
                Daten eingeben
              </a>
            </div>
          </div>
        </nav>

        <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>

        <footer className="mt-12 border-t border-gray-200 bg-white">
          <div className="max-w-6xl mx-auto px-4 py-4 text-center text-xs text-gray-500">
            GrünBilanz · CO₂-Bilanz nach GHG-Protokoll · Emissionsfaktoren: UBA 2024
          </div>
        </footer>
      </body>
    </html>
  );
}
