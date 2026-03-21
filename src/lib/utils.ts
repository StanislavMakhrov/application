/**
 * Utility function to merge Tailwind class names.
 * Uses clsx for conditional classes and tailwind-merge to resolve conflicts.
 */
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
