'use client';

/**
 * HelpTooltip — small ? icon next to field labels.
 * Shows a tooltip on hover/click with context about where to find the value.
 * Improves usability for SME users unfamiliar with emissions reporting.
 */

import { useState } from 'react';

interface HelpTooltipProps {
  text: string;
}

export function HelpTooltip({ text }: HelpTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span className="relative inline-flex ml-1 align-middle">
      <button
        type="button"
        className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-gray-100 text-xs text-gray-400 hover:bg-gray-200 hover:text-gray-600 focus:outline-none"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible((v) => !v)}
        aria-label="Hilfe"
      >
        ?
      </button>
      {isVisible && (
        <span className="absolute bottom-full left-1/2 z-50 mb-1 w-64 -translate-x-1/2 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 shadow-lg">
          {text}
        </span>
      )}
    </span>
  );
}
