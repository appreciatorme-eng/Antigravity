"use client";

import React, { useState, useEffect } from 'react';
import { IndianRupee, MessageSquare, Send, CheckCircle, User, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface ApprovalManagerProps {
    token: string;
    clientName: string;
}

interface Comment {
    id: string;
    author: string;
    comment: string;
    created_at: string;
}

export function ApprovalManager({ token, clientName }: ApprovalManagerProps) {
    const [status, setStatus] = useState<'viewed' | 'commented' | 'approved' | 'loading'>('loading');
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [authorName, setAuthorName] = useState(clientName || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [approvedBy, setApprovedBy] = useState('');
    const [approvedAt, setApprovedAt] = useState('');

    useEffect(() => {
        const loadStatus = async () => {
            try {
                const res = await fetch(`/api/share/${token}`);
                const data = await res.json();
                if (data.status) {
                    setStatus(data.status);
                    setComments(data.comments || []);
                    setApprovedBy(data.approved_by || '');
                    setApprovedAt(data.approved_at || '');
                }
            } catch (error) {
                console.error('Failed to load status:', error);
            }
        };
        loadStatus();
    }, [token]);

    const handleComment = async () => {
        if (!newComment.trim() || !authorName.trim()) return;
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/share/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'comment', author: authorName, comment: newComment })
            });
            const data = await res.json();
            if (data.success) {
                setComments(prev => [data.comment, ...prev]);
                setNewComment('');
                setStatus('commented');
            }
        } catch (error) {
            console.error('Failed to post comment:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleApprove = async () => {
        const name = prompt('Please enter your full name to finalize and approve this journey:', clientName);
        if (!name) return;

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/share/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'approve', name })
            });
            const data = await res.json();
            if (data.success) {
                setStatus('approved');
                setApprovedBy(name);
                setApprovedAt(new Date().toISOString());
            }
        } catch (error) {
            console.error('Failed to approve:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (status === 'loading') return <div className="max-w-4xl mx-auto px-4 py-8 text-center text-gray-400">Loading communications...</div>;

    return (
        <div className="max-w-4xl mx-auto px-4 py-12 space-y-12 mb-20">
            {/* Approval Section */}
            <Card className={`overflow-hidden border-2 transition-all ${status === 'approved' ? 'border-emerald-500 bg-emerald-50/30' : 'border-blue-100 shadow-xl'}`}>
                <CardHeader className={`${status === 'approved' ? 'bg-emerald-500' : 'bg-blue-600'} text-white p-8 text-center`}>
                    <div className="flex justify-center mb-4">
                        {status === 'approved' ? <CheckCircle className="w-16 h-16" /> : <Calendar className="w-16 h-16 opacity-80" />}
                    </div>
                    <CardTitle className="text-3xl font-serif">
                        {status === 'approved' ? 'Journey Finalized!' : 'Ready to Start Your Journey?'}
                    </CardTitle>
                    <CardDescription className="text-white/80 text-lg mt-2">
                        {status === 'approved'
                            ? 'Your trip has been approved. Our team will contact you shortly to finalize transitions.'
                            : 'If this plan looks perfect, approve it to move to the next stage of planning.'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-8 text-center">
                    {status === 'approved' ? (
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-6 py-3 rounded-full font-semibold">
                                <User className="w-5 h-5" /> Approved by {approvedBy}
                            </div>
                            <p className="text-gray-500 text-sm">
                                On {new Date(approvedAt).toLocaleDateString('en-IN', { dateStyle: 'long' })} at {new Date(approvedAt).toLocaleTimeString('en-IN')}
                            </p>
                        </div>
                    ) : (
                        <Button
                            size="lg"
                            onClick={handleApprove}
                            disabled={isSubmitting}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-8 text-xl rounded-2xl shadow-lg hover:scale-105 transition-all group"
                        >
                            <CheckCircle className="w-6 h-6 mr-3 group-hover:scale-125 transition-transform" />
                            Finalize & Approve This Journey
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* Conversation/Comments Section */}
            <div className="grid md:grid-cols-5 gap-8 items-start">
                <div className="md:col-span-2 space-y-4">
                    <h3 className="text-2xl font-serif flex items-center gap-2">
                        <MessageSquare className="w-6 h-6 text-blue-500" />
                        Conversations
                    </h3>
                    <p className="text-gray-500 leading-relaxed">
                        Have questions or want to request changes? Post a comment below and the tour operator will be notified instantly.
                    </p>

                    <div className="space-y-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 shadow-sm mt-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Your Name</label>
                            <Input
                                value={authorName}
                                onChange={e => setAuthorName(e.target.value)}
                                placeholder="E.g. Rahul Sharma"
                                className="bg-gray-50/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Comment or Feedback</label>
                            <Textarea
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                                placeholder="I'd like to spend more time in Jaipur..."
                                className="min-h-[120px] bg-gray-50/50"
                            />
                        </div>
                        <Button
                            onClick={handleComment}
                            disabled={isSubmitting || !newComment.trim()}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                            {isSubmitting ? 'Sending...' : 'Send Message'} <Send className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </div>

                <div className="md:col-span-3 space-y-4">
                    <div className="space-y-6">
                        {comments.length === 0 ? (
                            <div className="bg-gray-50/50 rounded-2xl p-12 text-center border-2 border-dashed border-gray-100">
                                <p className="text-gray-400 italic">No comments yet. Start the conversation!</p>
                            </div>
                        ) : (
                            comments.map((c) => (
                                <div key={c.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 shadow-sm space-y-2 relative group hover:border-blue-200 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                                {c.author[0]?.toUpperCase()}
                                            </div>
                                            <span className="font-bold text-gray-900 dark:text-gray-100">{c.author}</span>
                                        </div>
                                        <span className="text-[10px] text-gray-400 font-mono">
                                            {new Date(c.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed pl-10">
                                        {c.comment}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
