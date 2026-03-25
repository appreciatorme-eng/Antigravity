/* Poll picker — send a WhatsApp poll for client decisions. */
"use client";

import { useState } from "react";
import { BarChart3, Plus, Send, Trash2, Loader2 } from "lucide-react";
import type { ActionPickerProps } from "./shared";

const POLL_TEMPLATES = [
    { label: "Hotel Preference", question: "Which hotel do you prefer?", options: ["Option A", "Option B", "Option C"] },
    { label: "Travel Dates", question: "Which dates work best for you?", options: ["Option 1", "Option 2", "Option 3"] },
    { label: "Package Choice", question: "Which package interests you?", options: ["Budget", "Standard", "Premium"] },
];

export function PollPicker({ contact, onSend }: ActionPickerProps) {
    const [question, setQuestion] = useState("");
    const [options, setOptions] = useState(["", ""]);
    const [multiSelect, setMultiSelect] = useState(false);
    const [sending, setSending] = useState(false);

    function addOption() {
        if (options.length < 12) {
            setOptions([...options, ""]);
        }
    }

    function removeOption(index: number) {
        if (options.length > 2) {
            setOptions(options.filter((_, i) => i !== index));
        }
    }

    function updateOption(index: number, value: string) {
        setOptions(options.map((o, i) => (i === index ? value : o)));
    }

    function applyTemplate(template: typeof POLL_TEMPLATES[number]) {
        setQuestion(template.question);
        setOptions([...template.options]);
    }

    async function handleSend() {
        const validOptions = options.filter((o) => o.trim());
        if (!question.trim() || validOptions.length < 2) return;

        setSending(true);
        try {
            const phone = contact.phone.replace(/\D/g, "");
            const res = await fetch("/api/whatsapp/send-rich", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "poll",
                    phone,
                    question: question.trim(),
                    options: validOptions,
                    selectableCount: multiSelect ? validOptions.length : 1,
                }),
            });
            if (res.ok) {
                const preview = `📊 Poll: ${question.trim()}\n${validOptions.map((o, i) => `${i + 1}. ${o}`).join("\n")}`;
                await onSend(preview);
            }
        } finally {
            setSending(false);
        }
    }

    const validOptions = options.filter((o) => o.trim());
    const isValid = question.trim() && validOptions.length >= 2;

    return (
        <div className="space-y-4">
            {/* Templates */}
            <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Templates</label>
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {POLL_TEMPLATES.map((t) => (
                        <button
                            key={t.label}
                            onClick={() => applyTemplate(t)}
                            className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                        >
                            <BarChart3 className="w-3 h-3" /> {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Question */}
            <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Question</label>
                <input
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Which hotel do you prefer?"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-white/20"
                    maxLength={256}
                />
            </div>

            {/* Options */}
            <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Options ({validOptions.length}/12)</label>
                <div className="space-y-2">
                    {options.map((opt, i) => (
                        <div key={`poll-opt-${i}`} className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[9px] font-bold text-slate-400 shrink-0">
                                {i + 1}
                            </span>
                            <input
                                value={opt}
                                onChange={(e) => updateOption(i, e.target.value)}
                                placeholder={`Option ${i + 1}`}
                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-white/20"
                                maxLength={100}
                            />
                            {options.length > 2 && (
                                <button
                                    onClick={() => removeOption(i)}
                                    className="w-6 h-6 rounded-lg bg-white/5 hover:bg-red-500/20 flex items-center justify-center transition-colors"
                                >
                                    <Trash2 className="w-3 h-3 text-slate-500 hover:text-red-400" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                {options.length < 12 && (
                    <button
                        onClick={addOption}
                        className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-400 hover:text-white transition-colors"
                    >
                        <Plus className="w-3 h-3" /> Add Option
                    </button>
                )}
            </div>

            {/* Multi-select toggle */}
            <div className="flex items-center justify-between px-1">
                <span className="text-xs text-slate-400">Allow multiple selections</span>
                <button
                    onClick={() => setMultiSelect(!multiSelect)}
                    className={`w-8 h-4.5 rounded-full relative transition-colors ${
                        multiSelect ? "bg-[#25D366]" : "bg-slate-600"
                    }`}
                >
                    <span
                        className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${
                            multiSelect ? "translate-x-4" : "translate-x-0.5"
                        }`}
                    />
                </button>
            </div>

            <button
                onClick={() => { void handleSend(); }}
                disabled={!isValid || sending}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sending ? "Sending..." : `Send Poll to ${contact.name}`}
            </button>
        </div>
    );
}
