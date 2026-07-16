import React, { useState, useEffect } from 'react';
import { Bell, X, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/lib/axios';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      // Stub: Fetch from actual API when available
      const res = await apiClient.get('/notifications');
      if (res.data && res.data.success) {
        setNotifications(res.data.data);
        setUnreadCount(res.data.data.filter((n: Notification) => !n.isRead).length);
      }
    } catch (e) {
      // Mock data for UI testing if API fails
      setNotifications([
        { id: '1', title: 'Stok Menipis', message: 'Stok iPhone 15 Pro Max < 5 unit.', type: 'WARNING', isRead: false, createdAt: new Date().toISOString() },
        { id: '2', title: 'Transfer Masuk', message: 'Surat Jalan 001/MTG telah dikirim.', type: 'INFO', isRead: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
        { id: '3', title: 'Opname Selesai', message: 'Stock opname bulan ini selesai divalidasi.', type: 'SUCCESS', isRead: true, createdAt: new Date(Date.now() - 86400000).toISOString() }
      ]);
      setUnreadCount(2);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const markAllRead = async () => {
    try {
      await apiClient.post('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'WARNING': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'SUCCESS': return <CheckCircle className="w-5 h-5 text-green-500" />;
      default: return <Info className="w-5 h-5 text-indigo-500" />;
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-900" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 z-50 overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Notifikasi</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllRead}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                  >
                    Tandai semua dibaca
                  </button>
                )}
              </div>
              
              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map(n => (
                    <div 
                      key={n.id} 
                      onClick={() => markAsRead(n.id)}
                      className={`flex gap-3 p-4 border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors ${!n.isRead ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {getIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!n.isRead ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>
                          {n.title}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(n.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {!n.isRead && (
                        <div className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 mt-2" />
                      )}
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    Belum ada notifikasi
                  </div>
                )}
              </div>
              
              <div className="p-2 border-t border-gray-100 dark:border-gray-800">
                <button className="w-full py-2 text-sm text-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  Lihat Semua
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
