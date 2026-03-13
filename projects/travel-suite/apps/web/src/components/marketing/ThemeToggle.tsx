'use client';

import { useState, useSyncExternalStore } from 'react';
import { Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';

const subscribe = (callback: () => void) => {
    const observer = new MutationObserver(callback);
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
    });
    return () => observer.disconnect();
};

const getSnapshot = () => document.documentElement.classList.contains('dark');
const getServerSnapshot = () => true;

export function ThemeToggle() {
    const isDarkFromDOM = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
    const [isDark, setIsDark] = useState(isDarkFromDOM);

    const toggleTheme = () => {
        const nextIsDark = !isDark;
        setIsDark(nextIsDark);

        if (nextIsDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    return (
        <button
            onClick={toggleTheme}
            className="p-2 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors relative overflow-hidden"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
            <motion.div
                initial={false}
                animate={{
                    scale: isDark ? 1 : 0,
                    opacity: isDark ? 1 : 0,
                    rotate: isDark ? 0 : 90
                }}
                transition={{ duration: 0.2 }}
                className="absolute"
            >
                <Moon size={18} />
            </motion.div>
            <motion.div
                initial={false}
                animate={{
                    scale: isDark ? 0 : 1,
                    opacity: isDark ? 0 : 1,
                    rotate: isDark ? -90 : 0
                }}
                transition={{ duration: 0.2 }}
                className="absolute"
            >
                <Sun size={18} />
            </motion.div>
        </button>
    );
}
