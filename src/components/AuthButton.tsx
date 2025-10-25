'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import AuthModal from './AuthModal';

export default function AuthButton() {
  const { user, signOut, loading } = useAuth();
  const [showModal, setShowModal] = useState(false);

  // Debug: Log auth state
  console.log('AuthButton render:', { user, loading });

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="px-6 py-3 rounded-xl bg-white/10 text-gray-300"
      >
        <div className="animate-pulse">Loading...</div>
      </motion.button>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <div className="text-sm text-gray-300">
          {user.email}
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSignOut}
          className="px-6 py-3 rounded-xl bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all border border-red-400/30"
        >
          Sign Out
        </motion.button>
      </div>
    );
  }

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowModal(true)}
        className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-cyan-500 text-white hover:from-pink-600 hover:to-cyan-600 transition-all"
      >
        Sign In
      </motion.button>
      
      <AuthModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
      />
    </>
  );
}
