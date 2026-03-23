import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, placeholder, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          'flex h-[44px] w-full rounded-xl border border-card-border bg-white px-4 py-2 text-sm shadow-inner-sm',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green-light focus-visible:border-brand-green-mid',
          'hover:border-brand-green-mid/50',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-muted',
          'transition-all duration-150',
          className
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }
);
Select.displayName = 'Select';
