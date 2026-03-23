import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  default: 'bg-brand-gradient text-white shadow-green/30 shadow-sm hover:opacity-90 hover:shadow-green/40',
  outline: 'border border-card-border bg-white text-gray-800 hover:bg-gray-50 hover:border-brand-green/40',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100',
  destructive: 'bg-red-600 text-white shadow-sm hover:bg-red-700',
  secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
};

const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  default: 'px-4 py-2.5 text-sm min-h-[44px]',
  sm: 'px-3 py-1.5 text-xs min-h-[36px]',
  lg: 'px-6 py-3 text-base min-h-[48px]',
  icon: 'h-[44px] w-[44px] p-0',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-xl font-semibold transition-all',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
