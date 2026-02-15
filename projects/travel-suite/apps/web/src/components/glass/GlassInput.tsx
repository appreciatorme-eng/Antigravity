/**
 * Glass Input Component
 *
 * Unified input styles matching mobile app design
 * Supports text, email, password, number, textarea variants
 */

'use client';

import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: LucideIcon;
  fullWidth?: boolean;
}

export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  ({
    label,
    error,
    helperText,
    icon: Icon,
    fullWidth = true,
    className,
    ...props
  }, ref) => {
    const inputStyles = cn(
      'w-full px-4 py-3 rounded-xl',
      'bg-white/80 dark:bg-white/10',
      'border border-white/20 dark:border-white/10',
      'text-secondary dark:text-white',
      'placeholder:text-gray-400 dark:placeholder:text-gray-500',
      'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary',
      'transition-all duration-200',
      'shadow-sm',
      error && 'border-red-500 focus:ring-red-500/50 focus:border-red-500',
      Icon && 'pl-11',
      className
    );

    return (
      <div className={cn('space-y-1.5', fullWidth ? 'w-full' : '')}>
        {label && (
          <label className="block text-sm font-medium text-secondary dark:text-white/90">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {Icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              <Icon className="w-5 h-5" />
            </div>
          )}
          <input
            ref={ref}
            className={inputStyles}
            {...props}
          />
        </div>

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        {helperText && !error && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
        )}
      </div>
    );
  }
);

GlassInput.displayName = 'GlassInput';

export interface GlassTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export const GlassTextarea = forwardRef<HTMLTextAreaElement, GlassTextareaProps>(
  ({
    label,
    error,
    helperText,
    fullWidth = true,
    className,
    ...props
  }, ref) => {
    const textareaStyles = cn(
      'w-full px-4 py-3 rounded-xl',
      'bg-white/80 dark:bg-white/10',
      'border border-white/20 dark:border-white/10',
      'text-secondary dark:text-white',
      'placeholder:text-gray-400 dark:placeholder:text-gray-500',
      'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary',
      'transition-all duration-200',
      'shadow-sm',
      'resize-none',
      error && 'border-red-500 focus:ring-red-500/50 focus:border-red-500',
      className
    );

    return (
      <div className={cn('space-y-1.5', fullWidth ? 'w-full' : '')}>
        {label && (
          <label className="block text-sm font-medium text-secondary dark:text-white/90">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          className={textareaStyles}
          {...props}
        />

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        {helperText && !error && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
        )}
      </div>
    );
  }
);

GlassTextarea.displayName = 'GlassTextarea';

export interface GlassSelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: { value: string; label: string }[];
  fullWidth?: boolean;
}

export const GlassSelect = forwardRef<HTMLSelectElement, GlassSelectProps>(
  ({
    label,
    error,
    helperText,
    options,
    fullWidth = true,
    className,
    ...props
  }, ref) => {
    const selectStyles = cn(
      'w-full px-4 py-3 rounded-xl',
      'bg-white/80 dark:bg-white/10',
      'border border-white/20 dark:border-white/10',
      'text-secondary dark:text-white',
      'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary',
      'transition-all duration-200',
      'shadow-sm',
      'appearance-none cursor-pointer',
      error && 'border-red-500 focus:ring-red-500/50 focus:border-red-500',
      className
    );

    return (
      <div className={cn('space-y-1.5', fullWidth ? 'w-full' : '')}>
        {label && (
          <label className="block text-sm font-medium text-secondary dark:text-white/90">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            className={selectStyles}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        {helperText && !error && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
        )}
      </div>
    );
  }
);

GlassSelect.displayName = 'GlassSelect';
