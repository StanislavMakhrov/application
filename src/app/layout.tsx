import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import './globals.css';

export const metadata: Metadata = {
  title: 'GrünBilanz — CO₂-Fußabdruck',
  description: 'CO₂-Bilanzierungssoftware für Handwerksbetriebe',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
