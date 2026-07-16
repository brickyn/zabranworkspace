'use client';

import React from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Tag, Gift } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function PromoHub() {
  const modules = [
    {
      title: 'Diskon Item (Produk)',
      description: 'Atur diskon per produk dari inventory.',
      icon: Tag,
      href: '/promo/items',
      color: 'bg-blue-500/20 text-blue-500',
      border: 'border-blue-500/30'
    },
    {
      title: 'Kampanye & Voucher',
      description: 'Kelola diskon voucher global / per cabang.',
      icon: Gift,
      href: '/promo/campaigns',
      color: 'bg-purple-500/20 text-purple-500',
      border: 'border-purple-500/30'
    }
  ];

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col gap-6 max-w-7xl mx-auto pb-20 md:pb-10">
        
        {/* Header */}
        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}}>
          <h1 className="text-3xl font-bold text-foreground mb-2">Promo & Kampanye Hub</h1>
          <p className="text-muted">Pusat pengaturan diskon produk dan voucher.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {modules.map((mod, i) => (
            <Link href={mod.href} key={i}>
              <GlassCard interactive className={`p-6 border h-full flex flex-col justify-between ${mod.border} hover:bg-nav-hover transition-all`}>
                <div>
                  <div className={`p-4 rounded-2xl w-fit mb-4 ${mod.color}`}>
                    <mod.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{mod.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{mod.description}</p>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>

      </div>
    </DashboardLayout>
  );
}
