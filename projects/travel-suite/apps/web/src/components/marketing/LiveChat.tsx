'use client';

import { useState } from 'react';
import Image from 'next/image';
import { MessageCircle, X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function LiveChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        // In a real app, this would send to an API or open WhatsApp
        const whatsappUrl = `https://wa.me/919876543210?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        setMessage('');
        setIsOpen(false);
    };

    return (
        <>
            <div className="fixed bottom-6 right-6 z-[100]">
                <button
                    onClick={() => setIsOpen(true)}
                    className={`w-14 h-14 rounded-full bg-[#00F0FF] text-black shadow-[0_0_30px_rgba(0,240,255,0.4)] flex items-center justify-center hover:scale-110 transition-transform ${isOpen ? 'hidden' : 'flex'}`}
                >
                    <MessageCircle size={28} />
                </button>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="fixed bottom-6 right-6 z-[100] w-[350px] bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-[#00F0FF]/20 to-transparent p-4 flex items-center justify-between border-b border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden">
                                        <Image src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop" alt="Support" width={40} height={40} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#00FF88] border-2 border-[#0A0A0A] rounded-full"></div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white">TravelBuilt Support</h4>
                                    <p className="text-xs text-[#00F0FF]">Typically replies in 2 mins</p>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Chat Area */}
                        <div className="p-4 h-[300px] overflow-y-auto bg-black/50 space-y-4">
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-white/10 overflow-hidden shrink-0">
                                    <Image src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop" alt="Support" width={32} height={32} className="w-full h-full object-cover" />
                                </div>
                                <div className="bg-[#1A1A1A] p-3 rounded-2xl rounded-tl-none border border-white/5 text-sm text-gray-300">
                                    Hi there! 👋 How can we help you grow your travel business today?
                                </div>
                            </div>
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-[#0A0A0A] border-t border-white/10">
                            <form onSubmit={handleSend} className="relative">
                                <input
                                    type="text"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Type your message..."
                                    className="w-full bg-[#1A1A1A] border border-white/10 rounded-full py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-[#00F0FF]/50"
                                />
                                <button
                                    type="submit"
                                    disabled={!message.trim()}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#00F0FF] text-black flex items-center justify-center disabled:opacity-50 disabled:bg-gray-600 disabled:text-gray-400"
                                >
                                    <Send size={14} className="ml-0.5" />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
