import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GrünBilanz — CO₂ Fußabdruck für Handwerksbetriebe',
  description: 'Berechnen Sie den CO₂-Fußabdruck Ihres Handwerksbetriebs nach GHG-Protokoll Scope 1 & 2',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
