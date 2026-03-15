// Phase 5: NL Compliance Chatbot — "Ask the Terminal"
// Floating chat button, RAG, citations, user context
// Do not modify previous phases

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const ComplianceChatbot: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string; sources?: any[] }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, liabilityProfile } = useAuth();

  async function sendMessage() {
    if (!input.trim()) return;
    setLoading(true);
    setMessages((msgs) => [...msgs, { role: 'user', content: input }]);
    // Call Supabase Edge Function for RAG chat
    // @ts-ignore: supabase.functions.invoke is available in the browser client
    const { data, error } = await window.supabase.functions.invoke('rag-chat', {
      body: { query: input, userId: user ? user.id : null },
    });
    if (error) {
      setMessages((msgs) => [...msgs, { role: 'assistant', content: 'Error: ' + error.message }]);
    } else {
      setMessages((msgs) => [...msgs, { role: 'assistant', content: data.answer, sources: data.sources }]);
    }
    setInput('');
    setLoading(false);
  }

  return (
    <>
      <button
        className="fixed bottom-6 right-6 z-50 bg-terminal-green text-black rounded-full p-4 shadow-lg hover:scale-105 transition"
        onClick={() => setOpen((o) => !o)}
        aria-label="Ask the Terminal"
      >
        💬
      </button>
      {open && (
        <div className="fixed bottom-24 right-6 w-96 max-w-full bg-[#0d1117] border border-terminal-green rounded-lg shadow-2xl z-50 flex flex-col">
          <div className="flex items-center justify-between p-3 border-b border-terminal-green">
            <span className="font-mono text-terminal-green">Ask the Terminal</span>
            <button onClick={() => setMessages([])} className="text-xs text-terminal-amber hover:underline">Clear chat</button>
            <button onClick={() => setOpen(false)} className="ml-2 text-lg">×</button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ maxHeight: 400 }}>
            {messages.map((msg, i) => (
              <div key={i} className={msg.role === 'user' ? 'text-right' : 'text-left'}>
                <div className={msg.role === 'user' ? 'bg-terminal-green text-black inline-block px-2 py-1 rounded' : 'bg-terminal-gray text-white inline-block px-2 py-1 rounded'}>
                  {msg.content}
                </div>
                {msg.role === 'assistant' && msg.sources && (
                  <div className="mt-1 text-xs text-terminal-amber">
                    Sources: {msg.sources.map((src: any, j: number) => (
                      <a key={j} href={src.url} target="_blank" rel="noopener noreferrer" className="underline mr-2">{src.title}</a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <form className="flex border-t border-terminal-green" onSubmit={e => { e.preventDefault(); sendMessage(); }}>
            <input
              className="flex-1 bg-transparent px-3 py-2 text-white outline-none"
              placeholder="Ask a compliance question..."
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={loading}
              autoFocus
            />
            <button type="submit" className="bg-terminal-green text-black px-4 py-2 font-mono" disabled={loading}>Send</button>
          </form>
        </div>
      )}
    </>
  );
};

export default ComplianceChatbot;
