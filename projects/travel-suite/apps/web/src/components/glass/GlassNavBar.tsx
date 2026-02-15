/**
 * GlassNavBar Component
 *
 * Floating glassmorphic navigation bar matching mobile GlassFloatingNavBar
 * Features: pill shape, backdrop blur, active state indicators
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import {
  Home,
  Map,
  MessageCircle,
  User,
  Sparkles,
  Ticket,
  Inbox,
  Terminal,
} from 'lucide-react';

export interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href?: string;
  onClick?: () => void;
}

interface GlassNavBarProps {
  items: NavItem[];
  activeIndex: number;
  onItemClick: (index: number) => void;
  className?: string;
}

export function GlassNavBar({ items, activeIndex, onItemClick, className }: GlassNavBarProps) {
  return (
    <nav
      className={cn(
        // Container
        'fixed bottom-3 left-4 right-4 z-50',
        'max-w-md mx-auto',
        className
      )}
    >
      <div
        className={cn(
          // Glass effect
          'backdrop-blur-[20px] bg-white/85',
          'border border-white/60',
          'rounded-full',

          // Layout
          'h-14 px-2 py-2',
          'flex items-center justify-between gap-1',

          // Shadow
          'shadow-[0_10px_18px_rgba(0,0,0,0.07)]',
        )}
      >
        {items.map((item, index) => {
          const Icon = item.icon;
          const isActive = index === activeIndex;

          return (
            <button
              key={index}
              onClick={() => {
                onItemClick(index);
                item.onClick?.();
              }}
              className={cn(
                // Base
                'flex items-center justify-center',
                'w-11 h-11 rounded-full',
                'transition-all duration-200',

                // Active state
                isActive
                  ? 'bg-[#00D084] shadow-[0_8px_14px_rgba(0,208,132,0.3)]'
                  : 'bg-transparent hover:bg-white/40',

                // Scale animation
                'hover:scale-105 active:scale-95'
              )}
              aria-label={item.label}
            >
              <Icon
                className={cn(
                  'w-5.5 h-5.5',
                  isActive ? 'text-white' : 'text-[#124EA2]/55'
                )}
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// Preset navigation configurations matching mobile
export const travelerNavItems: NavItem[] = [
  { icon: Home, label: 'Trips' },
  { icon: Sparkles, label: 'Explore' },
  { icon: MessageCircle, label: 'Concierge' },
  { icon: Ticket, label: 'Bookings' },
  { icon: User, label: 'Profile' },
];

export const driverNavItems: NavItem[] = [
  { icon: Home, label: 'Home' },
  { icon: Map, label: 'Route' },
  { icon: Terminal, label: 'Command' },
  { icon: Inbox, label: 'Inbox' },
  { icon: User, label: 'Profile' },
];

// Special centered concierge button (matching _TravelerConciergeItem)
export function ConciergeNavButton({ onClick, isActive }: { onClick: () => void; isActive?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center justify-center',
        'w-13 h-13 rounded-full',
        'bg-[#00D084]',
        'shadow-[0_12px_18px_rgba(0,208,132,0.4)]',
        'transition-all duration-200',
        'hover:scale-110 active:scale-95',
        isActive && 'ring-2 ring-white ring-offset-2 ring-offset-transparent'
      )}
    >
      <Sparkles className="w-6 h-6 text-white" strokeWidth={2.5} />
    </button>
  );
}
