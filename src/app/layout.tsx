import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GrünBilanz – CO₂-Fußabdruck für Handwerksbetriebe',
  description:
    'Berechnen Sie den CO₂-Fußabdruck Ihres Handwerksbetriebs schnell und einfach nach GHG Protocol.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-green-50 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
