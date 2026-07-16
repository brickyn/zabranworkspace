import React, { useState, useEffect } from 'react';
import { Target, Edit2, Check, X, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { GlassCard } from '@/components/ui/GlassCard';

interface KPITargetCardProps {
  division: string;
  actualValue: number;
  month: number; // 1-12
  year: number;
  formatValue?: (val: number) => string;
  title?: string;
}

export default function KPITargetCard({ 
  division, 
  actualValue, 
  month, 
  year, 
  formatValue = (val) => val.toString(),
  title = "Pencapaian KPI Bulanan"
}: KPITargetCardProps) {
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [targetValue, setTargetValue] = useState<number>(0);
  const [targetType, setTargetType] = useState<string>('Unit');
  const [notes, setNotes] = useState<string>('');
  
  // Edit Form States
  const [editValue, setEditValue] = useState<string>('0');
  const [editType, setEditType] = useState<string>('Unit');

  useEffect(() => {
    fetchKPI();
  }, [division, month, year]);

  const fetchKPI = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/kpi?division=${division}&month=${month}&year=${year}`);
      if (res.data?.data) {
        setTargetValue(res.data.data.targetValue);
        setTargetType(res.data.data.targetType);
        setNotes(res.data.data.notes || '');
        setEditValue(res.data.data.targetValue.toString());
        setEditType(res.data.data.targetType);
      } else {
        setTargetValue(0);
        setEditValue('0');
      }
    } catch (error) {
      console.error('Error fetching KPI', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await apiClient.post('/kpi', {
        division,
        month,
        year,
        targetValue: Number(editValue),
        targetType: editType,
        notes
      });
      toast.success('Target KPI berhasil diperbarui');
      setTargetValue(Number(editValue));
      setTargetType(editType);
      setIsEditing(false);
    } catch (error) {
      toast.error('Gagal menyimpan target KPI');
    }
  };

  const percentage = targetValue > 0 ? Math.min(100, Math.round((actualValue / targetValue) * 100)) : 0;
  
  // Determine color based on percentage
  let progressColor = 'bg-gray-500';
  let textColor = 'text-gray-400';
  if (percentage >= 100) { progressColor = 'bg-green-500'; textColor = 'text-green-400'; }
  else if (percentage >= 70) { progressColor = 'bg-blue-500'; textColor = 'text-blue-400'; }
  else if (percentage >= 40) { progressColor = 'bg-yellow-500'; textColor = 'text-yellow-400'; }
  else if (targetValue > 0) { progressColor = 'bg-red-500'; textColor = 'text-red-400'; }

  return (
    <GlassCard className="p-6 relative overflow-hidden flex flex-col justify-between h-full">
      {/* Decorative background element */}
      <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-20 ${progressColor}`}></div>
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div>
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-400" />
            {title}
          </h3>
          <p className="text-xs text-gray-400 mt-1">Bulan {month}/{year}</p>
        </div>
        
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)} 
            className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
        </div>
      ) : isEditing ? (
        <div className="bg-card-bg p-4 rounded-xl border border-glass-border relative z-10">
          <div className="mb-3">
            <label className="block text-xs font-medium text-muted mb-1">Target Pencapaian</label>
            <div className="flex gap-2">
              <input 
                type="number" 
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full bg-background border border-glass-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-indigo-500 outline-none"
                placeholder="0"
              />
              <input 
                type="text"
                value={editType}
                onChange={(e) => setEditType(e.target.value)}
                className="w-1/3 bg-background border border-glass-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-indigo-500 outline-none"
                placeholder="Unit/Visit"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button 
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 bg-gray-600/30 hover:bg-gray-600/50 text-gray-300 rounded-lg text-xs font-semibold flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Batal
            </button>
            <button 
              onClick={handleSave}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" /> Simpan
            </button>
          </div>
        </div>
      ) : (
        <div className="relative z-10 flex flex-col gap-5">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-muted text-sm mb-1">Target: <span className="text-foreground font-semibold">{formatValue(targetValue)} {targetType}</span></p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground">{formatValue(actualValue)}</span>
                <span className="text-gray-400 text-sm">dicapai</span>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-2xl font-black ${textColor}`}>{percentage}%</span>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-background rounded-full h-3 border border-glass-border overflow-hidden">
            <div 
              className={`h-full rounded-full ${progressColor} transition-all duration-1000 ease-out`}
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        </div>
      )}
    </GlassCard>
  );
}
