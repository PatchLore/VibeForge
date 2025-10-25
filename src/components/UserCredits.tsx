'use client';

import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';

export default function UserCredits() {
  const { user, loading } = useAuth();

  if (loading || !user) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/20"
    >
      <span className="text-2xl">💎</span>
      <span className="text-white font-medium">
        Loading credits...
      </span>
    </motion.div>
  );
}
