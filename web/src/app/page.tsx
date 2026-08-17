'use client';

import React, { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Array<{ content: string; distance: number }>;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I am your Gorvu Financial Advisor. How can I help you invest or manage your assets today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [threadId, setThreadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Otomatik aşağı kaydırma
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessageContent = input;
    setInput('');
    setLoading(true);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessageContent,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessageContent,
          threadId: threadId,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.threadId) {
        setThreadId(data.threadId);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
        sources: data.sources,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `⚠️ Hata: ${err.message || 'Yanıt alınırken bir sorun oluştu.'}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-radial from-slate-900 via-zinc-950 to-black text-slate-100 flex flex-col items-center justify-between p-4 md:p-8 font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      
      {/* Header Panel */}
      <header className="w-full max-w-4xl flex items-center justify-between border-b border-slate-800/60 pb-6 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-pulse">
            <span className="text-xl font-bold text-slate-950">G</span>
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-200 to-indigo-400 bg-clip-text text-transparent">
              Gorvu AI
            </h1>
            <p className="text-xs text-slate-400 font-mono">Financial Advisory RAG Platform</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.7)]"></span>
          <span className="text-xs text-slate-400 font-mono">Live RAG Engine</span>
        </div>
      </header>

      {/* Main Container */}
      <div className="w-full max-w-4xl flex-1 bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-2xl flex flex-col overflow-hidden shadow-2xl relative">
        
        {/* Background Decorative Gradients */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full filter blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/5 rounded-full filter blur-[100px] pointer-events-none"></div>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 min-h-[450px] relative z-10">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
            >
              <div
                className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 shadow-lg transition-all duration-300 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-slate-50 rounded-tr-none hover:shadow-emerald-950/20'
                    : 'bg-slate-800/70 border border-slate-700/50 backdrop-blur-md rounded-tl-none hover:border-slate-600/50'
                }`}
              >
                <div className="flex items-center justify-between gap-8 mb-2 pb-1 border-b border-white/10">
                  <span className="text-[10px] uppercase font-mono tracking-wider opacity-60">
                    {msg.role === 'user' ? 'Client Request' : 'Gorvu Advisor'}
                  </span>
                  <span className="text-[9px] opacity-40 font-mono">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap font-sans">{msg.content}</p>
                {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 font-semibold block">
                      Retrieved References:
                    </span>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {msg.sources.map((src, i) => (
                        <div key={i} className="text-[11px] bg-slate-950/40 border border-slate-700/30 rounded-lg p-2 font-mono text-slate-300">
                          <div className="flex justify-between items-center text-[9px] text-slate-500 mb-1 border-b border-white/5 pb-0.5">
                            <span>Chunk #{i + 1}</span>
                            <span className="text-emerald-500/80 font-bold">Distance: {src.distance.toFixed(4)}</span>
                          </div>
                          <span className="font-sans leading-relaxed text-slate-400 block">{src.content}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-800/70 border border-slate-700/50 backdrop-blur-md rounded-2xl rounded-tl-none p-4 max-w-[75%] shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  <span className="text-xs text-slate-400 ml-2 font-mono">Retrieving from guide & thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSend}
          className="p-4 bg-slate-950/80 border-t border-slate-800/80 backdrop-blur-lg flex gap-3 relative z-10"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a financial question (e.g. How can I double my money?)"
            className="flex-1 bg-slate-900 border border-slate-800 focus:border-emerald-500/80 rounded-xl px-4 py-3 text-sm focus:outline-none transition-all duration-300 focus:ring-1 focus:ring-emerald-500/30 placeholder:text-slate-500 text-slate-200"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold px-6 py-3 rounded-xl text-sm transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-95"
          >
            Send
          </button>
        </form>
      </div>

      {/* Footer Info */}
      <footer className="w-full max-w-4xl text-center mt-6 text-[10px] text-slate-600 font-mono">
        &copy; {new Date().getFullYear()} Gorvu LLC. All rights reserved. Powered by OpenAI Assistants API (File Search).
      </footer>
    </main>
  );
}
