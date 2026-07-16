'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { forwardRef } from 'react';

interface GlassCardProps extends HTMLMotionProps<"div"> {
  className?: string;
  children: React.ReactNode;
  interactive?: boolean;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, children, interactive = false, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
        }}
        whileHover={interactive ? {
          scale: 1.02,
          y: -5,
          transition: { type: "spring", stiffness: 300, damping: 10 }
        } : undefined}
        whileTap={interactive ? { scale: 0.98 } : undefined}
        className={`relative overflow-hidden rounded-2xl bg-glass-bg backdrop-blur-xl border border-glass-border shadow-lg transition-all duration-300 ${interactive ? 'cursor-pointer hover:shadow-indigo-500/10 hover:border-indigo-500/50' : ''} ${className || ''}`}
        {...props}
      >
        {/* Shine effect overlay for liquid feel */}
        {interactive && (
          <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-tr from-transparent via-white/5 to-transparent" />
        )}
        <div className="relative z-10 h-full">
          {children}
        </div>
      </motion.div>
    );
  }
);

GlassCard.displayName = 'GlassCard';
