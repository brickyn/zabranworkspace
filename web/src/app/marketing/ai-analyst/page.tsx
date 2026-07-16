'use client';

import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { 
  Bot, RefreshCw, AlertTriangle, Lightbulb, 
  ThumbsUp, ThumbsDown, TrendingUp, Download, MessageSquare, Send, DollarSign
} from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { GlassCard } from '@/components/ui/GlassCard';

export default function AIManagerPage() {
  const [adAccounts, setAdAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [error, setError] = useState('');
  
  const [aiReport, setAiReport] = useState<any>(null);

  // Chat State
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAdAccounts();
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, chatLoading]);

  const fetchAdAccounts = async () => {
    setLoadingAccounts(true);
    setError('');
    try {
      const res = await apiClient.get('/meta/ad-accounts');
      if (res.data.success && res.data.data.length > 0) {
        setAdAccounts(res.data.data);
        setSelectedAccount(res.data.data[0].id);
      } else {
        setError('Tidak ada Ad Account yang ditemukan.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal memuat daftar Ad Account.');
    } finally {
      setLoadingAccounts(false);
    }
  };

  const analyzeCampaign = async () => {
    if (!selectedAccount) return;
    setLoadingAI(true);
    setError('');
    try {
      const res = await apiClient.post('/meta/ai-analyze', { adAccountId: selectedAccount });
      if (res.data.success) {
        setAiReport(res.data.data);
      } else {
        setError(res.data.error || 'AI Gagal memproses data.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal terhubung ke AI server.');
    } finally {
      setLoadingAI(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedAccount) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatLoading(true);

    try {
      const res = await apiClient.post('/meta/ai-chat', {
        adAccountId: selectedAccount,
        message: userMessage,
        history: chatHistory.map(h => ({ role: h.role, content: h.content }))
      });
      if (res.data.success) {
        setChatHistory(prev => [...prev, { role: 'assistant', content: res.data.data.reply }]);
      }
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'assistant', content: 'Maaf, terjadi kesalahan saat menghubungi AI.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        
        {/* Header Section (Hide on print) */}
        <GlassCard className="print:hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Bot className="w-6 h-6 text-purple-400" />
              AI Marketing Analyst
            </h1>
            <p className="text-sm text-muted mt-1">
              Dapatkan insight, rekomendasi, dan analisis otomatis dari data campaign Anda.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {loadingAccounts ? (
              <div className="animate-pulse h-10 w-48 bg-white/5 rounded-xl"></div>
            ) : (
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="bg-glass-bg backdrop-blur-md border border-glass-border text-foreground rounded-xl px-4 py-2.5 outline-none focus:border-purple-500 w-full md:w-auto"
              >
                {adAccounts.length === 0 && <option value="">Pilih Ad Account</option>}
                {adAccounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.account_id})
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={analyzeCampaign}
              disabled={loadingAI || !selectedAccount}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingAI ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
              <span className="hidden sm:inline">Analyze Campaign</span>
            </button>
            
            {aiReport && (
              <button
                onClick={() => window.print()}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export PDF</span>
              </button>
            )}
          </div>
        </GlassCard>

        {error && (
          <div className="print:hidden p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm opacity-90">{error}</p>
          </div>
        )}

        {/* AI Report Section */}
        {aiReport && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column (Report) */}
            <div className="lg:col-span-2 space-y-6 print:w-full print:block">
              
              {/* Daily Insight & Exec Summary */}
              <GlassCard className="p-6 border-purple-500/30 print:border-black bg-gradient-to-br from-glass-bg to-transparent">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-500/20 rounded-xl">
                    <Lightbulb className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white mb-1">Today's Insight</h2>
                    <p className="text-muted text-sm mb-4 leading-relaxed">{aiReport.dailyInsight}</p>
                    
                    <h3 className="text-md font-semibold text-white mb-1">Executive Summary</h3>
                    <p className="text-muted text-sm leading-relaxed whitespace-pre-wrap">{aiReport.executiveSummary}</p>
                  </div>
                </div>
              </GlassCard>

              {/* Best & Worst Campaigns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <GlassCard className="p-5 print:border-black">
                  <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <ThumbsUp className="w-4 h-4 text-green-400" /> Best Campaigns
                  </h3>
                  <ul className="space-y-4">
                    {aiReport.bestCampaigns?.map((camp: any, idx: number) => (
                      <li key={idx} className="bg-glass-bg p-3 rounded-xl border border-green-500/20">
                        <p className="text-sm font-semibold text-white">{camp.name}</p>
                        <p className="text-xs text-muted mt-1">{camp.reason}</p>
                      </li>
                    ))}
                  </ul>
                </GlassCard>
                
                <GlassCard className="p-5 print:border-black">
                  <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <ThumbsDown className="w-4 h-4 text-red-400" /> Worst Campaigns
                  </h3>
                  <ul className="space-y-4">
                    {aiReport.worstCampaigns?.map((camp: any, idx: number) => (
                      <li key={idx} className="bg-glass-bg p-3 rounded-xl border border-red-500/20">
                        <p className="text-sm font-semibold text-white">{camp.name}</p>
                        <p className="text-xs text-red-400/80 mt-1 font-medium">{camp.issue}</p>
                        <p className="text-xs text-muted mt-1">{camp.reason}</p>
                      </li>
                    ))}
                  </ul>
                </GlassCard>
              </div>

              {/* Recommendations */}
              <GlassCard className="p-6 print:border-black">
                <h3 className="text-foreground font-bold mb-4">Budget Recommendations</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-glass-border">
                        <th className="p-3 text-xs text-muted uppercase">Campaign</th>
                        <th className="p-3 text-xs text-muted uppercase">Action</th>
                        <th className="p-3 text-xs text-muted uppercase">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-glass-border">
                      {aiReport.budgetRecommendations?.map((rec: any, idx: number) => (
                        <tr key={idx}>
                          <td className="p-3 text-sm text-white font-medium">{rec.name}</td>
                          <td className="p-3">
                            <span className={`inline-flex px-2 py-1 text-[10px] font-bold uppercase rounded-full ${
                              rec.action.toLowerCase().includes('scale') ? 'bg-green-500/20 text-green-400' :
                              rec.action.toLowerCase().includes('pause') ? 'bg-red-500/20 text-red-400' :
                              'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {rec.action}
                            </span>
                          </td>
                          <td className="p-3 text-xs text-muted">{rec.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassCard>

              {/* Funnel & ROAS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-glass-bg p-5 rounded-2xl border border-glass-border print:border-black">
                  <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-400" /> Funnel Analysis
                  </h3>
                  <p className="text-sm text-muted leading-relaxed whitespace-pre-wrap">{aiReport.funnelAnalysis}</p>
                </div>

                <div className="bg-glass-bg p-5 rounded-2xl border border-glass-border print:border-black">
                  <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-400" /> Internal ROAS
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between border-b border-glass-border pb-2">
                      <span className="text-sm text-muted">Total ERP Revenue</span>
                      <span className="text-sm text-white font-semibold">Rp {aiReport.internalRoas?.revenue?.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between border-b border-glass-border pb-2">
                      <span className="text-sm text-muted">Total Meta Spend</span>
                      <span className="text-sm text-white font-semibold">Rp {aiReport.internalRoas?.spend?.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between bg-green-500/10 p-2 rounded-lg">
                      <span className="text-sm font-bold text-green-400">ROAS</span>
                      <span className="text-sm font-bold text-green-400">{aiReport.internalRoas?.roas?.toFixed(2)}x</span>
                    </div>
                    <p className="text-xs text-muted mt-2">{aiReport.internalRoas?.analysis}</p>
                  </div>
                </div>
              </div>
              
            </div>

            {/* Right Column (Alerts & Chat) */}
            <div className="space-y-6 print:hidden">
              
              {/* Alerts */}
              <div className="bg-glass-bg p-5 rounded-2xl border border-red-500/30">
                <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-red-400">
                  <AlertTriangle className="w-4 h-4" /> System Alerts
                </h3>
                <ul className="space-y-3">
                  {aiReport.alerts?.map((alert: string, idx: number) => (
                    <li key={idx} className="text-sm text-red-300/90 bg-red-500/10 p-3 rounded-xl border border-red-500/10">
                      {alert}
                    </li>
                  ))}
                  {aiReport.opportunities?.map((opp: string, idx: number) => (
                    <li key={idx} className="text-sm text-green-300/90 bg-green-500/10 p-3 rounded-xl border border-green-500/10">
                      <span className="font-bold block mb-1 text-green-400">Opportunity</span>
                      {opp}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Chat Interface */}
              <div className="bg-glass-bg rounded-2xl border border-glass-border flex flex-col h-[500px]">
                <div className="p-4 border-b border-glass-border flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-purple-400" />
                  <h3 className="font-bold text-white">Ask AI Analyst</h3>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white/5 p-3 rounded-2xl rounded-tl-none border border-glass-border text-sm text-gray-200">
                      Halo! Aku sudah membaca performa campaign kamu. Ada yang ingin ditanyakan atau butuh saran spesifik?
                    </div>
                  </div>

                  {chatHistory.map((msg, idx) => (
                    <div key={idx} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-purple-600'}`}>
                        {msg.role === 'user' ? <span className="text-white text-xs font-bold">U</span> : <Bot className="w-4 h-4 text-white" />}
                      </div>
                      <div className={`p-3 rounded-2xl text-sm border ${
                        msg.role === 'user' 
                          ? 'bg-blue-600/20 text-blue-100 rounded-tr-none border-blue-500/20' 
                          : 'bg-white/5 text-gray-200 rounded-tl-none border-glass-border whitespace-pre-wrap'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  
                  {chatLoading && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-white/5 px-4 py-3 rounded-2xl rounded-tl-none border border-glass-border text-sm flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="p-4 border-t border-glass-border">
                  <form onSubmit={handleChatSubmit} className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Tanya soal CTR, ROAS, dll..."
                      className="flex-1 bg-glass-bg border border-glass-border rounded-xl px-4 py-2 text-sm text-foreground outline-none focus:border-purple-500"
                    />
                    <button
                      type="submit"
                      disabled={chatLoading || !chatInput.trim()}
                      className="w-10 h-10 bg-purple-600 hover:bg-purple-700 text-white rounded-xl flex items-center justify-center disabled:opacity-50 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          .print\\:block, .print\\:block * { visibility: visible; }
          .print\\:hidden { display: none !important; }
          .print\\:block { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%;
            margin: 0;
            padding: 20px;
          }
          .print\\:border-black { border: 1px solid #ddd !important; background: #fff !important; }
          .print\\:border-black * { color: #000 !important; }
        }
      `}} />
    </DashboardLayout>
  );
}
// Note: Icon import DollarSign is missing, will fix this
