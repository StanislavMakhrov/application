'use client';

/**
 * WizardNav — navigation buttons at the bottom of each wizard screen.
 * Shows "Zurück" and "Weiter" buttons, plus the current step indicator.
 */

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface WizardNavProps {
  currentScreen: number;
  totalScreens?: number;
  onSave?: () => void;
  isSaving?: boolean;
}

export function WizardNav({
  currentScreen,
  totalScreens = 7,
  onSave,
  isSaving,
}: WizardNavProps) {
  const router = useRouter();

  const canGoBack = currentScreen > 1;
  const canGoForward = currentScreen < totalScreens;

  return (
    <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
      <Button
        variant="outline"
        onClick={() => router.push(`/wizard/${currentScreen - 1}`)}
        disabled={!canGoBack}
      >
        ← Zurück
      </Button>

      <div className="flex gap-2">
        {onSave && (
          <Button variant="secondary" onClick={onSave} disabled={isSaving}>
            {isSaving ? 'Speichern...' : '💾 Speichern'}
          </Button>
        )}

        {canGoForward ? (
          <Button onClick={() => router.push(`/wizard/${currentScreen + 1}`)}>
            Weiter →
          </Button>
        ) : (
          <Button onClick={() => router.push('/')}>
            Zum Dashboard →
          </Button>
        )}
      </div>
    </div>
  );
}
