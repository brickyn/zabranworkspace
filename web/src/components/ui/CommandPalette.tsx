import React, { useState, useEffect } from 'react';
import { Search, X, Package, Users, ShoppingCart, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const router = useRouter();

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelect = (path: string) => {
    setIsOpen(false);
    setSearch('');
    router.push(path);
  };

  // Mock quick actions based on input
  const quickLinks = [
    { name: 'Data Produk', icon: Package, path: '/products' },
    { name: 'Transfer Stok', icon: Activity, path: '/stock-transfer' },
    { name: 'Point of Sales', icon: ShoppingCart, path: '/pos' },
    { name: 'Database Pelanggan', icon: Users, path: '/customers' },
  ];

  const filteredLinks = quickLinks.filter(link => 
    link.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] sm:pt-[20vh]">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm"
          />
          
          {/* Modal */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="relative w-full max-w-xl mx-4 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden"
          >
            <div className="flex items-center px-4 py-4 border-b border-gray-100 dark:border-gray-800">
              <Search className="w-5 h-5 text-gray-400 mr-3" />
              <input
                autoFocus
                type="text"
                placeholder="Cari produk, pelanggan, atau menu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 text-lg"
              />
              <button onClick={() => setIsOpen(false)} className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-2 max-h-[60vh] overflow-y-auto">
              <div className="px-2 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Quick Actions
              </div>
              
              {filteredLinks.length > 0 ? (
                <div className="space-y-1">
                  {filteredLinks.map((link, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelect(link.path)}
                      className="w-full flex items-center px-4 py-3 text-sm text-left text-gray-700 dark:text-gray-300 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 group transition-colors"
                    >
                      <link.icon className="w-4 h-4 mr-3 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                      {link.name}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-gray-500">
                  Tidak ada hasil ditemukan.
                </div>
              )}
            </div>
            
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-xs text-gray-500">
              <span>Tekan <kbd className="font-sans px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">Esc</kbd> untuk menutup</span>
              <span className="hidden sm:inline">Navigasi dengan panah</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
