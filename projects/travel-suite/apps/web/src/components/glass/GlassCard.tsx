/**
 * GlassCard Component
 *
 * Glassmorphism card matching mobile GlassCard widget
 * Features: backdrop blur, soft transparency, subtle borders
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

interface GlassCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children?: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  blur?: 'sm' | 'md' | 'lg';
  opacity?: 'low' | 'medium' | 'high';
  rounded?: 'md' | 'lg' | 'xl' | '2xl' | 'pill';
  hoverEffect?: boolean;
}

const paddingClasses = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
  xl: 'p-6',
};

const blurClasses = {
  sm: 'backdrop-blur-sm',
  md: 'backdrop-blur-md',
  lg: 'backdrop-blur-lg',
};

const opacityClasses = {
  low: 'bg-white/50',
  medium: 'bg-white/65',
  high: 'bg-white/85',
};

const roundedClasses = {
  md: 'rounded-xl',
  lg: 'rounded-[20px]',
  xl: 'rounded-[24px]',
  '2xl': 'rounded-[32px]',
  pill: 'rounded-full',
};

export function GlassCard({
  children,
  className,
  padding = 'lg',
  blur = 'md',
  opacity = 'medium',
  rounded = 'xl',
  onClick,
  hoverEffect = false,
  ...rest
}: GlassCardProps) {
  return (
    <motion.div
      whileHover={hoverEffect || onClick ? { scale: 1.01, y: -2 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        // Base glass effect
        'relative overflow-hidden',
        blurClasses[blur],
        opacityClasses[opacity],
        'border border-white/60',
        roundedClasses[rounded],
        paddingClasses[padding],

        // Shadow
        'shadow-[0_8px_32px_rgba(31,38,135,0.07)]',

        // Transition
        'transition-colors duration-200',

        // Hover effect tailwind replaced partially by framer-motion above, but we keep shadow hover
        (hoverEffect || onClick) && 'cursor-pointer hover:shadow-[0_12px_40px_rgba(31,38,135,0.12)]',

        className
      )}
      onClick={onClick}
      {...(rest as any)}
    >
      {children}
    </motion.div>
  );
}

export function GlassContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'bg-white/65 rounded-[20px]',
        'border border-white/60',
        'shadow-[0_10px_20px_rgba(0,0,0,0.05)]',
        className
      )}
    >
      {children}
    </div>
  );
}

export function GlassPill({
  children,
  className,
  variant = 'primary',
}: {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'neutral';
}) {
  const variantClasses = {
    primary: 'bg-[#00D084]/20 border-[#00D084]/40',
    secondary: 'bg-[#124EA2]/20 border-[#124EA2]/40',
    neutral: 'bg-gray-100 border-gray-200',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2',
        'px-3.5 py-2.5 rounded-full',
        'border',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </div>
  );
}

export function GlassIconButton({
  icon,
  onClick,
  size = 'md',
  variant = 'default',
  className,
}: {
  icon: React.ReactNode;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const variantClasses = {
    default: 'bg-white/80 text-[#124EA2]',
    primary: 'bg-[#00D084]/20 text-[#00D084]',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center',
        'rounded-full',
        sizeClasses[size],
        variantClasses[variant],
        'shadow-[0_6px_10px_rgba(0,0,0,0.05)]',
        'transition-all duration-200',
        'hover:scale-105 active:scale-95',
        className
      )}
    >
      {icon}
    </button>
  );
}
