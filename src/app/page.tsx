"use client";

import { useEffect, useRef, useState } from "react";
import rules from "./rules.json";

type Message = {
  id: number;
  sender: "user" | "bot";
  text: string;
  time: string;
};

const GREETING =
  "Assalam-o-Alaikum! 👋\n\nUniversity of Sargodha Helpdesk mein khush aamdeed. Main admission, fee, scholarship, hostel, exams, library, transport aur timings ke bare mein madad kar sakta hoon.\n\nTip: Neeche diye gaye topics par click karein ya apna sawal likhein.";

const FALLBACK =
  "Maazrat, mujhe is sawal ka jawab nahi mila. Meharbani karke admission, fee, scholarship, hostel, exams, library, transport ya timings ke bare mein poochein, ya university office se rabta karein.";

const TOPICS = [
  { label: "Admission", icon: "📝" },
  { label: "Fee", icon: "💳" },
  { label: "Scholarship", icon: "🎓" },
  { label: "Hostel", icon: "🏠" },
  { label: "Exams", icon: "📊" },
  { label: "Library", icon: "📚" },
  { label: "Transport", icon: "🚌" },
  { label: "Timings", icon: "🕘" },
  { label: "Contact", icon: "📞" },
];

const WEBSITE = "https://uos.edu.pk";

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getReply(input: string): string {
  const padded = ` ${normalize(input)} `;
  let bestReply = "";
  let bestScore = 0;

  for (const rule of rules) {
    let score = 0;
    for (const keyword of rule.keywords) {
      const k = normalize(keyword);
      if (k && padded.includes(` ${k} `)) {
        score += k.split(" ").length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestReply = rule.reply;
    }
  }

  return bestScore > 0 ? bestReply : FALLBACK;
}

function nowTime(): string {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Icon({
  children,
  className = "h-5 w-5",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {children}
    </svg>
  );
}

function UniLogo({ size = "h-11 w-11" }: { size?: string }) {
  return (
    <div
      className={`${size} flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white p-0.5 shadow-md ring-2 ring-white/40`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/image.png"
        alt="University of Sargodha logo"
        className="h-full w-full rounded-full object-contain"
      />
    </div>
  );
}

function BotAvatar() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-700 to-teal-500 text-white shadow-sm">
      <Icon className="h-4 w-4">
        <rect x="4" y="8" width="16" height="12" rx="3" />
        <path d="M12 8V4" />
        <circle cx="12" cy="3" r="1" />
        <circle cx="9" cy="14" r="1" />
        <circle cx="15" cy="14" r="1" />
      </Icon>
    </div>
  );
}

function BotText({ text }: { text: string }) {
  const blocks = text.split("\n\n");

  if (blocks.length === 1) {
    return <p>{text}</p>;
  }

  return (
    <div className="space-y-2.5">
      {blocks.map((block, i) => {
        if (i === 0) {
          return (
            <p key={i} className="font-semibold text-slate-900">
              {block}
            </p>
          );
        }
        if (block.startsWith("•")) {
          return (
            <ul key={i} className="space-y-1.5">
              {block.split("\n").map((line, j) => (
                <li key={j} className="flex gap-2">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />
                  <span>{line.replace(/^•\s*/, "")}</span>
                </li>
              ))}
            </ul>
          );
        }
        if (block.startsWith("Tip:")) {
          return (
            <p
              key={i}
              className="rounded-lg border-l-4 border-emerald-500 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-900"
            >
              <span className="font-semibold">💡 Tip:</span>{" "}
              {block.replace(/^Tip:\s*/, "")}
            </p>
          );
        }
        return <p key={i}>{block}</p>;
      })}
    </div>
  );
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, sender: "bot", text: GREETING, time: "" },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const nextId = useRef(1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Greeting ka time client par set hota hai (hydration mismatch se bachne ke liye)
  useEffect(() => {
    setMessages((prev) =>
      prev.map((m) => (m.id === 0 ? { ...m, time: nowTime() } : m)),
    );
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  function send(raw: string) {
    const text = raw.trim();
    if (!text || typing) return;

    const userMsg: Message = {
      id: nextId.current++,
      sender: "user",
      text,
      time: nowTime(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    const timer = setTimeout(() => {
      const botMsg: Message = {
        id: nextId.current++,
        sender: "bot",
        text: getReply(text),
        time: nowTime(),
      };
      setMessages((prev) => [...prev, botMsg]);
      setTyping(false);
      inputRef.current?.focus();
    }, 700);
    timers.current.push(timer);
  }

  function clearChat() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setTyping(false);
    setInput("");
    setMessages([{ id: 0, sender: "bot", text: GREETING, time: nowTime() }]);
  }

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-slate-100">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-80 shrink-0 flex-col bg-gradient-to-b from-emerald-900 via-emerald-800 to-teal-900 text-white lg:flex">
        <div className="flex items-center gap-3 border-b border-white/10 p-6">
          <UniLogo size="h-14 w-14" />
          <div>
            <h2 className="text-lg font-bold leading-tight">
              University of Sargodha
            </h2>
            <p className="text-xs text-emerald-100">Student Helpdesk</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <p className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-wider text-emerald-200/80">
            Quick Topics
          </p>
          <div className="space-y-1">
            {TOPICS.map((t) => (
              <button
                key={t.label}
                onClick={() => send(t.label)}
                disabled={typing}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-emerald-50 transition hover:bg-white/10 disabled:opacity-50"
              >
                <span className="text-lg">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-white/10 p-5">
          <a
            href={WEBSITE}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium transition hover:bg-white/20"
          >
            Official Website
            <Icon className="h-4 w-4">
              <path d="M7 17 17 7" />
              <path d="M8 7h9v9" />
            </Icon>
          </a>
          <p className="mt-3 text-center text-[11px] text-emerald-200/70">
            © {new Date().getFullYear()} UOS Helpdesk Bot
          </p>
        </div>
      </aside>

      {/* Chat panel */}
      <main className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="flex items-center gap-3 bg-gradient-to-r from-emerald-800 to-teal-700 px-4 py-3 text-white shadow-md sm:px-6 sm:py-4">
          <div className="lg:hidden">
            <UniLogo size="h-10 w-10" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold leading-tight sm:text-lg">
              UOS Helpdesk Bot
            </h1>
            <p className="flex items-center gap-1.5 text-xs text-emerald-100">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
              </span>
              Online · University of Sargodha
            </p>
          </div>
          <button
            onClick={clearChat}
            title="Chat clear karein"
            className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-medium transition hover:bg-white/20"
          >
            <Icon className="h-4 w-4">
              <path d="M3 6h18" />
              <path d="M8 6V4h8v2" />
              <path d="m19 6-1 14H6L5 6" />
            </Icon>
            <span className="hidden sm:inline">Clear Chat</span>
          </button>
        </header>

        {/* Messages */}
        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 px-3 py-5 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-3xl space-y-5">
            {messages.map((m) => {
              const isUser = m.sender === "user";
              return (
                <div
                  key={m.id}
                  className={`flex items-end gap-2 ${
                    isUser ? "justify-end" : "justify-start"
                  }`}
                >
                  {!isUser && <BotAvatar />}
                  <div
                    className={`flex max-w-[85%] flex-col sm:max-w-[75%] ${
                      isUser ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`px-4 py-3 text-sm leading-relaxed shadow-sm ${
                        isUser
                          ? "rounded-2xl rounded-br-md bg-gradient-to-br from-emerald-700 to-teal-600 text-white"
                          : "rounded-2xl rounded-bl-md border border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      {isUser ? m.text : <BotText text={m.text} />}
                    </div>
                    <span className="mt-1 px-1 text-[11px] text-slate-400">
                      {m.time}
                    </span>
                  </div>
                </div>
              );
            })}

            {typing && (
              <div className="flex items-end gap-2">
                <BotAvatar />
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
                  {[0, 150, 300].map((d) => (
                    <span
                      key={d}
                      className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
                      style={{ animationDelay: `${d}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Topic chips (mobile / tablet) */}
        <div className="flex gap-2 overflow-x-auto border-t border-slate-200 bg-white px-3 pt-3 sm:px-6 lg:hidden">
          {TOPICS.map((t) => (
            <button
              key={t.label}
              onClick={() => send(t.label)}
              disabled={typing}
              className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-medium text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-50"
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="border-t border-slate-200 bg-white px-3 py-3 sm:px-6 lg:border-t lg:px-10">
          <div className="mx-auto flex max-w-3xl items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send(input);
              }}
              enterKeyHint="send"
              placeholder="Apna sawal yahan likhein..."
              className="min-w-0 flex-1 rounded-full border border-slate-300 bg-slate-50 px-5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || typing}
              className="flex shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-emerald-700 to-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:from-emerald-800 hover:to-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="hidden sm:inline">Send</span>
              <Icon className="h-4 w-4">
                <path d="m22 2-7 20-4-9-9-4 20-7Z" />
                <path d="M22 2 11 13" />
              </Icon>
            </button>
          </div>
          <p className="mx-auto mt-2 max-w-3xl text-center text-[11px] text-slate-400">
            Automated assistant. Zaroori maloomat university office se confirm
            karein.
          </p>
        </div>
      </main>
    </div>
  );
}
