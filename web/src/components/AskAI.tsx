'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, Bot, User } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiClient } from '@/lib/axios';

export default function AskAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [chat, setChat] = useState<{ role: 'ai' | 'user'; content: string }[]>([
    { role: 'ai', content: 'Halo! Saya Zaidan, asisten AI Zabran Workspaces. Ada yang bisa saya bantu rangkum atau analisis dari data Anda hari ini?' }
  ]);
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMessage = query.trim();
    setChat(prev => [...prev, { role: 'user', content: userMessage }]);
    setQuery('');
    setLoading(true);

    try {
      const res = await apiClient.post('/system/ask-zaidan', { 
        message: userMessage,
        history: chat.map(c => ({ role: c.role === 'ai' ? 'assistant' : 'user', content: c.content }))
      });
      if (res.data.success) {
        setChat(prev => [...prev, { role: 'ai', content: res.data.data.reply }]);
      } else {
        toast.error('Gagal terhubung dengan Zaidan');
      }
    } catch (error) {
      toast.error('Gagal terhubung dengan Zaidan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-2xl hover:scale-105 transition-transform z-40 flex items-center gap-2 group"
      >
        <Sparkles className="w-6 h-6 animate-pulse" />
        <span className="hidden group-hover:inline-block font-medium pr-2 transition-all">Ask AI</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] bg-[#1F2833] border border-white/10 rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden"
            style={{ height: '500px', maxHeight: '70vh' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex justify-between items-center">
              <div className="flex items-center gap-2 text-white">
                <Bot className="w-6 h-6" />
                <h3 className="font-bold">Zaidan (Zabran AI Assistant)</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white bg-white/10 p-1.5 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chat.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'ai' ? 'bg-blue-600/20 text-blue-400' : 'bg-gray-600/50 text-gray-300'}`}>
                    {msg.role === 'ai' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                  </div>
                  <div className={`p-3 rounded-2xl max-w-[75%] text-sm ${msg.role === 'ai' ? 'bg-[#0B0C10] border border-white/5 text-gray-300 rounded-tl-none' : 'bg-blue-600 text-white rounded-tr-none'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-3 flex-row">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-600/20 text-blue-400">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="p-3 rounded-2xl bg-[#0B0C10] border border-white/5 text-gray-300 rounded-tl-none flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 bg-black/20 border-t border-white/5 flex gap-2">
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Tanya tentang Zabran Workspaces..."
                className="flex-1 bg-[#0B0C10] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500/50"
              />
              <button 
                type="submit" 
                disabled={loading || !query.trim()}
                className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
