/**
 * Glass Button Component
 *
 * Unified button styles matching mobile app design
 * Supports primary, secondary, and outline variants
 */

'use client';

import { ButtonHTMLAttributes, MouseEvent, forwardRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface GlassButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({
    variant = 'primary',
    size = 'md',
    loading = false,
    fullWidth = false,
    className,
    children,
    disabled,
    onClick,
    ...props
  }, ref) => {
    const [submitting, setSubmitting] = useState(false);
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantStyles = {
      primary: 'bg-primary text-white hover:bg-opacity-90 shadow-button',
      secondary: 'bg-secondary text-white hover:bg-opacity-90 shadow-button',
      outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white',
      ghost: 'text-secondary hover:bg-white/40',
      danger: 'bg-red-500 text-white hover:bg-red-600 shadow-button',
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-xs rounded-lg',
      md: 'px-4 py-2.5 text-sm rounded-xl',
      lg: 'px-6 py-3.5 text-base rounded-xl',
    };

    const widthStyles = fullWidth ? 'w-full' : '';
    const isDisabled = disabled || loading || submitting;

    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
      if (isDisabled) {
        event.preventDefault();
        return;
      }

      if (!onClick) return;

      const maybeResult = (onClick as (evt: MouseEvent<HTMLButtonElement>) => unknown)(event);
      if (!maybeResult || typeof (maybeResult as Promise<unknown>)?.then !== 'function') {
        return;
      }

      setSubmitting(true);
      (maybeResult as Promise<unknown>).finally(() => {
        setSubmitting(false);
      });
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          widthStyles,
          className
        )}
        disabled={isDisabled}
        onClick={handleClick}
        {...(props as any)}
      >
        {(loading || submitting) && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </motion.button>
    );
  }
);

GlassButton.displayName = 'GlassButton';
