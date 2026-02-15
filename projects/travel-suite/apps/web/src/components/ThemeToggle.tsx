/**
 * Dark Mode Toggle Component
 *
 * Switches between light and dark themes matching mobile app
 * Persists preference in localStorage
 */

'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    updateTheme(initialTheme);
  }, []);

  const updateTheme = (newTheme: 'light' | 'dark') => {
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    updateTheme(newTheme);
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <button
        className={cn(
          'relative w-14 h-7 rounded-full transition-colors',
          'bg-gray-200',
          className
        )}
        aria-label="Toggle theme"
      />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'relative w-14 h-7 rounded-full transition-all duration-300',
        theme === 'dark' ? 'bg-[#00d084]' : 'bg-gray-300',
        'hover:opacity-80 active:scale-95',
        className
      )}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {/* Toggle slider */}
      <div
        className={cn(
          'absolute top-0.5 w-6 h-6 rounded-full',
          'bg-white shadow-md',
          'transition-all duration-300',
          'flex items-center justify-center',
          theme === 'dark' ? 'left-[calc(100%-1.75rem)]' : 'left-0.5'
        )}
      >
        {theme === 'dark' ? (
          <Moon className="w-3.5 h-3.5 text-[#124ea2]" />
        ) : (
          <Sun className="w-3.5 h-3.5 text-[#f59e0b]" />
        )}
      </div>
    </button>
  );
}

export function ThemeToggleButton({ className }: { className?: string }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    updateTheme(initialTheme);
  }, []);

  const updateTheme = (newTheme: 'light' | 'dark') => {
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    updateTheme(newTheme);
  };

  if (!mounted) {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center',
          'w-10 h-10 rounded-full',
          'bg-white/80 text-[#124ea2]',
          'shadow-[0_6px_10px_rgba(0,0,0,0.05)]',
          className
        )}
        aria-label="Toggle theme"
      >
        <Sun className="w-5 h-5" />
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'inline-flex items-center justify-center',
        'w-10 h-10 rounded-full',
        'transition-all duration-200',
        'hover:scale-105 active:scale-95',
        theme === 'dark'
          ? 'bg-[#00d084]/20 text-[#00d084]'
          : 'bg-white/80 text-[#124ea2]',
        'shadow-[0_6px_10px_rgba(0,0,0,0.05)]',
        className
      )}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'dark' ? (
        <Moon className="w-5 h-5" />
      ) : (
        <Sun className="w-5 h-5" />
      )}
    </button>
  );
}
