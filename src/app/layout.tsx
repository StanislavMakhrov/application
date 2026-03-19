import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GrünBilanz – CO₂-Fußabdruck für Handwerksbetriebe',
  description:
    'Berechnen Sie den CO₂-Fußabdruck Ihres Handwerksbetriebs gemäß GHG-Protokoll (Scope 1 & 2) und UBA 2024 Emissionsfaktoren.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
