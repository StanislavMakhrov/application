/**
 * Root layout — wraps every page in the application.
 * Sets the HTML lang to "de" (German) per DSGVO/localisation requirements.
 */
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GrünBilanz — CO₂-Fußabdruck für Handwerksbetriebe',
  description:
    'Berechnen, verstehen und reporten Sie den CO₂-Fußabdruck Ihres Handwerksbetriebs — einfach, schnell und GHG-Protocol-konform.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
