import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  default:
    'bg-gradient-brand text-white shadow-sm hover:shadow-md hover:opacity-95 active:scale-[0.98]',
  outline:
    'border border-card-border bg-white text-gray-800 hover:border-brand-green-mid hover:text-brand-green shadow-card hover:shadow-md',
  ghost: 'bg-transparent text-gray-700 hover:bg-brand-green-muted hover:text-brand-green',
  destructive: 'bg-red-600 text-white shadow-sm hover:bg-red-700 hover:shadow-md active:scale-[0.98]',
  secondary: 'bg-surface-muted text-gray-800 border border-card-border hover:bg-brand-green-muted hover:text-brand-green shadow-card',
};

const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  default: 'px-5 py-2.5 text-sm min-h-[44px]',
  sm: 'px-3.5 py-1.5 text-xs min-h-[36px]',
  lg: 'px-7 py-3 text-base min-h-[48px]',
  icon: 'h-[44px] w-[44px] p-0',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green-light focus-visible:ring-offset-1',
          'disabled:pointer-events-none disabled:opacity-40',
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
