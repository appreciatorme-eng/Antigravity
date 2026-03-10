'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function NotFound() {
    const [keys, setKeys] = useState<string[]>([]);
    const [unlocked, setUnlocked] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            setKeys((prev) => {
                const newKeys = [...prev, e.key.toLowerCase()].slice(-5);
                if (newKeys.join('') === 'mario') {
                    setUnlocked(true);
                }
                return newKeys;
            });
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center text-center px-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2000&auto=format&fit=crop')] bg-cover opacity-10"></div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10"
            >
                <h1 className="text-[150px] font-black leading-none text-transparent bg-clip-text bg-gradient-to-br from-[#00F0FF] to-[#FF9933]">
                    404
                </h1>
                <h2 className="text-3xl font-bold text-white mb-6">Looks like you're lost in transit.</h2>
                <p className="text-gray-400 max-w-md mx-auto mb-10">
                    The page you're looking for doesn't exist or has been moved. Let's get you back to civilization.
                </p>

                <Link
                    href="/"
                    className="px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors"
                >
                    Return to Dashboard
                </Link>
                <p className="mt-8 text-xs text-gray-700">Type "mario" for a surprise</p>
            </motion.div>

            {unlocked && (
                <motion.div
                    initial={{ y: "100vh" }}
                    animate={{ y: "-100vh" }}
                    transition={{ duration: 5, ease: "linear" }}
                    className="absolute z-50 pointer-events-none"
                >
                    <div className="text-6xl">🍄</div>
                </motion.div>
            )}
        </div>
    );
}
