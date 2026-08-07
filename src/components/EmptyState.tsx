import React from 'react';
import { motion } from 'motion/react';
import { LucideIcon, SearchX } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: LucideIcon;
  theme?: 'dark' | 'light';
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = SearchX,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon: ActionIcon,
  theme = 'dark',
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-3xl border ${
        theme === 'dark'
          ? 'bg-zinc-900/40 border-zinc-800/80 shadow-2xl'
          : 'bg-white/80 border-zinc-200/80 shadow-xl backdrop-blur-md'
      } max-w-md mx-auto my-6 ${className}`}
    >
      {/* Glow background & Icon circle */}
      <div className="relative mb-5 flex items-center justify-center">
        <div className="absolute inset-0 bg-red-600/20 blur-2xl rounded-full transform scale-150 pointer-events-none" />
        <div
          className={`relative p-5 rounded-2xl border ${
            theme === 'dark'
              ? 'bg-zinc-950 border-zinc-800 text-red-500 shadow-inner'
              : 'bg-red-50 border-red-100 text-red-600 shadow-sm'
          }`}
        >
          <Icon className="w-10 h-10 stroke-[1.5]" />
        </div>
      </div>

      {/* Title */}
      <h3
        className={`text-lg sm:text-xl font-extrabold tracking-tight mb-2 ${
          theme === 'dark' ? 'text-white' : 'text-zinc-900'
        }`}
      >
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p
          className={`text-xs sm:text-sm max-w-xs leading-relaxed mb-6 ${
            theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'
          }`}
        >
          {description}
        </p>
      )}

      {/* Action Button */}
      {actionLabel && onAction && (
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={onAction}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-red-900/30 transition-all cursor-pointer"
        >
          {ActionIcon && <ActionIcon className="w-4 h-4" />}
          <span>{actionLabel}</span>
        </motion.button>
      )}
    </motion.div>
  );
};

export default EmptyState;
