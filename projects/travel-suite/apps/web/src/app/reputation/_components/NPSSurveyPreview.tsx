"use client";

interface NPSSurveyPreviewProps {
  question?: string;
  promoterThreshold?: number;
  passiveThreshold?: number;
}

const DEFAULT_QUESTION = "How likely are you to recommend us to a friend?";
const DEFAULT_PROMOTER = 9;
const DEFAULT_PASSIVE = 7;

export default function NPSSurveyPreview({
  question,
  promoterThreshold,
  passiveThreshold,
}: NPSSurveyPreviewProps) {
  const npsQuestion = question || DEFAULT_QUESTION;
  const promoter = promoterThreshold ?? DEFAULT_PROMOTER;
  const passive = passiveThreshold ?? DEFAULT_PASSIVE;

  return (
    <div className="flex flex-col items-center">
      {/* Phone frame */}
      <div className="w-[280px] rounded-[2rem] border-[3px] border-zinc-600 bg-zinc-900 shadow-2xl shadow-black/40 overflow-hidden">
        {/* Status bar */}
        <div className="flex items-center justify-between px-5 py-2 bg-zinc-900">
          <span className="text-[10px] text-zinc-400 font-medium">9:41</span>
          <div className="flex items-center gap-1">
            <div className="w-3.5 h-2 rounded-[1px] border border-zinc-500 relative">
              <div className="absolute inset-[1px] right-[3px] bg-zinc-400 rounded-[0.5px]" />
            </div>
          </div>
        </div>

        {/* WhatsApp header */}
        <div className="bg-[#1F2C33] px-3 py-2 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#25D366]/20 flex items-center justify-center shrink-0">
            <svg
              className="w-4 h-4 text-[#25D366]"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 01-4.264-1.227l-.306-.182-2.866.852.852-2.866-.182-.306A8 8 0 1120 12a8 8 0 01-8 8z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-zinc-100 truncate">
              Travel Review Bot
            </p>
            <p className="text-[10px] text-zinc-400">online</p>
          </div>
        </div>

        {/* Chat body */}
        <div className="bg-[#0B141A] p-3 space-y-2 min-h-[320px]">
          {/* Bot message: NPS question */}
          <ChatBubble sender="bot" className="bg-[#1F2C33]">
            <p className="text-xs text-zinc-200 leading-relaxed">
              {npsQuestion}
            </p>
            <p className="text-[10px] text-zinc-400 mt-1">
              Reply with a number from 1 to 10
            </p>
          </ChatBubble>

          {/* User replies with 9 */}
          <ChatBubble sender="user" className="bg-[#005C4B]">
            <p className="text-xs text-zinc-100">9</p>
          </ChatBubble>

          {/* Promoter response */}
          <ChatBubble sender="bot" className="bg-[#1F2C33]">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-[10px] font-semibold text-emerald-400">
                  Score: {promoter}-10
                </span>
              </div>
              <p className="text-xs text-zinc-200">
                Thank you! We&apos;re so glad you enjoyed your trip.
              </p>
              <p className="text-xs text-zinc-200">
                Would you mind leaving us a quick review on Google? It helps
                other travelers find us.
              </p>
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2 mt-1">
                <p className="text-[10px] text-emerald-400 font-medium">
                  Leave a Google Review
                </p>
              </div>
            </div>
          </ChatBubble>

          {/* Separator */}
          <div className="flex items-center gap-2 py-1">
            <div className="flex-1 h-px bg-zinc-700/50" />
            <span className="text-[8px] text-zinc-600 font-medium">
              OR
            </span>
            <div className="flex-1 h-px bg-zinc-700/50" />
          </div>

          {/* Passive scenario */}
          <ChatBubble sender="user" className="bg-[#005C4B]">
            <p className="text-xs text-zinc-100">{passive}</p>
          </ChatBubble>

          <ChatBubble sender="bot" className="bg-[#1F2C33]">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-[10px] font-semibold text-amber-400">
                  Score: {passive}-{promoter - 1}
                </span>
              </div>
              <p className="text-xs text-zinc-200">
                Thank you for your feedback. What would have made your experience
                a 10?
              </p>
            </div>
          </ChatBubble>

          {/* Separator */}
          <div className="flex items-center gap-2 py-1">
            <div className="flex-1 h-px bg-zinc-700/50" />
            <span className="text-[8px] text-zinc-600 font-medium">
              OR
            </span>
            <div className="flex-1 h-px bg-zinc-700/50" />
          </div>

          {/* Detractor scenario */}
          <ChatBubble sender="user" className="bg-[#005C4B]">
            <p className="text-xs text-zinc-100">3</p>
          </ChatBubble>

          <ChatBubble sender="bot" className="bg-[#1F2C33]">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-[10px] font-semibold text-red-400">
                  Score: 1-{passive - 1}
                </span>
              </div>
              <p className="text-xs text-zinc-200">
                We&apos;re sorry to hear that. Your feedback is important to us.
                Please tell us more so we can improve.
              </p>
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-2 mt-1">
                <p className="text-[10px] text-red-400 font-medium">
                  Private Feedback Form
                </p>
              </div>
            </div>
          </ChatBubble>
        </div>

        {/* WhatsApp input bar */}
        <div className="bg-[#1F2C33] px-3 py-2 flex items-center gap-2">
          <div className="flex-1 bg-[#2A3942] rounded-full px-3 py-1.5">
            <p className="text-[10px] text-zinc-500">Type a message</p>
          </div>
          <div className="w-7 h-7 rounded-full bg-[#25D366] flex items-center justify-center shrink-0">
            <svg
              className="w-3.5 h-3.5 text-white"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </div>
        </div>

        {/* Home indicator */}
        <div className="bg-zinc-900 py-2 flex justify-center">
          <div className="w-24 h-1 rounded-full bg-zinc-700" />
        </div>
      </div>

      {/* Routing legend */}
      <div className="mt-4 grid grid-cols-3 gap-2 text-center w-full max-w-[280px]">
        <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/10 p-2">
          <p className="text-[10px] font-bold text-emerald-400">
            {promoter}-10
          </p>
          <p className="text-[8px] text-zinc-500 mt-0.5">
            Public Review
          </p>
        </div>
        <div className="rounded-lg bg-amber-500/5 border border-amber-500/10 p-2">
          <p className="text-[10px] font-bold text-amber-400">
            {passive}-{promoter - 1}
          </p>
          <p className="text-[8px] text-zinc-500 mt-0.5">
            Follow-up
          </p>
        </div>
        <div className="rounded-lg bg-red-500/5 border border-red-500/10 p-2">
          <p className="text-[10px] font-bold text-red-400">
            1-{passive - 1}
          </p>
          <p className="text-[8px] text-zinc-500 mt-0.5">
            Private Form
          </p>
        </div>
      </div>
    </div>
  );
}

function ChatBubble({
  sender,
  className,
  children,
}: {
  sender: "bot" | "user";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex ${sender === "user" ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[85%] rounded-xl px-2.5 py-2 ${className ?? ""}`}
      >
        {children}
      </div>
    </div>
  );
}
