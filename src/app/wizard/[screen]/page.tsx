/**
 * Dynamic wizard screen router — delegates to the appropriate screen component
 * based on the [screen] URL segment (1–7).
 */

import { notFound } from 'next/navigation';
import Screen1Firmenprofil from '@/components/wizard/screens/Screen1Firmenprofil';
import Screen2Heizung from '@/components/wizard/screens/Screen2Heizung';
import Screen3Fuhrpark from '@/components/wizard/screens/Screen3Fuhrpark';
import Screen4Strom from '@/components/wizard/screens/Screen4Strom';
import Screen5Dienstreisen from '@/components/wizard/screens/Screen5Dienstreisen';
import Screen6Materialien from '@/components/wizard/screens/Screen6Materialien';
import Screen7Abfall from '@/components/wizard/screens/Screen7Abfall';

interface WizardScreenPageProps {
  params: { screen: string };
  searchParams: { year?: string };
}

export default function WizardScreenPage({ params, searchParams }: WizardScreenPageProps) {
  const screen = parseInt(params.screen, 10);
  const year = parseInt(searchParams.year ?? '2024', 10);

  switch (screen) {
    case 1:
      return <Screen1Firmenprofil />;
    case 2:
      return <Screen2Heizung year={year} />;
    case 3:
      return <Screen3Fuhrpark year={year} />;
    case 4:
      return <Screen4Strom year={year} />;
    case 5:
      return <Screen5Dienstreisen year={year} />;
    case 6:
      return <Screen6Materialien year={year} />;
    case 7:
      return <Screen7Abfall year={year} />;
    default:
      notFound();
  }
}

// Generate static params for screens 1–7 to avoid dynamic rendering warnings
export function generateStaticParams() {
  return [1, 2, 3, 4, 5, 6, 7].map((id) => ({ screen: String(id) }));
}
