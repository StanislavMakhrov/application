import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-[44px] w-full rounded-xl border border-card-border bg-white px-3.5 py-2 text-sm',
          'placeholder:text-gray-300',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/50 focus-visible:border-brand-green',
          'hover:border-brand-green/30 transition-colors',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';
