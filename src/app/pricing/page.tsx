'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const startCheckout = async (type: 'subscription' | 'topup', priceId: string) => {
    setLoading(priceId);
    
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          priceId,
          email: 'user@example.com', // In production, get from user session
        }),
      });

      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoading(null);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-pink-900 to-cyan-900 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl md:text-6xl font-light text-white mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-cyan-400">
              Choose Your Plan
            </span>
          </h1>
          <p className="text-xl text-gray-300">
            Start creating AI music today
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Free Plan */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 hover:border-pink-500/50 transition-all"
          >
            <div className="text-center mb-6">
              <h2 className="text-3xl font-semibold text-white mb-2">Free</h2>
              <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-cyan-400">
                $0
              </div>
              <p className="text-gray-400 text-sm mt-2">Forever free</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-center text-gray-300">
                <span className="text-green-400 mr-3">✓</span>
                100 free credits to start
              </li>
              <li className="flex items-center text-gray-300">
                <span className="text-green-400 mr-3">✓</span>
                12 credits per generation
              </li>
              <li className="flex items-center text-gray-300">
                <span className="text-green-400 mr-3">✓</span>
                AI-generated artwork
              </li>
              <li className="flex items-center text-gray-300">
                <span className="text-green-400 mr-3">✓</span>
                Save tracks locally
              </li>
              <li className="flex items-center text-gray-300">
                <span className="text-green-400 mr-3">✓</span>
                No credit card required
              </li>
            </ul>

            <motion.a
              href="/"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 px-6 rounded-2xl bg-white/20 text-white font-semibold hover:bg-white/30 transition-all block text-center"
            >
              Get Started Free
            </motion.a>
          </motion.div>

          {/* Pro Plan */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-pink-500/20 to-cyan-500/20 backdrop-blur-lg rounded-3xl p-8 border-2 border-pink-500/50 relative overflow-hidden"
          >
            <div className="text-center mb-6">
              <h2 className="text-3xl font-semibold text-white mb-2">Pro</h2>
              <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-cyan-400">
                $9.99
              </div>
              <p className="text-gray-400 text-sm mt-2">per month</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-center text-gray-300">
                <span className="text-green-400 mr-3">✓</span>
                2,000 credits/month
              </li>
              <li className="flex items-center text-gray-300">
                <span className="text-green-400 mr-3">✓</span>
                ~166 generations
              </li>
              <li className="flex items-center text-gray-300">
                <span className="text-green-400 mr-3">✓</span>
                AI-generated artwork
              </li>
              <li className="flex items-center text-gray-300">
                <span className="text-green-400 mr-3">✓</span>
                Cloud storage
              </li>
              <li className="flex items-center text-gray-300">
                <span className="text-green-400 mr-3">✓</span>
                Priority generation
              </li>
              <li className="flex items-center text-gray-300">
                <span className="text-green-400 mr-3">✓</span>
                Commercial license
              </li>
            </ul>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => startCheckout('subscription', 'price_pro_month')}
              disabled={loading === 'price_pro_month'}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-pink-500 to-cyan-500 text-white font-semibold hover:from-pink-600 hover:to-cyan-600 transition-all disabled:opacity-50"
            >
              {loading === 'price_pro_month' ? 'Loading...' : 'Subscribe to Pro'}
            </motion.button>
          </motion.div>
        </div>

        {/* Creator Plan */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-3xl p-8 border-2 border-purple-500/50 relative overflow-hidden"
          >
            <div className="text-center mb-6">
              <h2 className="text-3xl font-semibold text-white mb-2">Creator</h2>
              <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                $19.99
              </div>
              <p className="text-gray-400 text-sm mt-2">per month</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-center text-gray-300">
                <span className="text-green-400 mr-3">✓</span>
                5,000 credits/month
              </li>
              <li className="flex items-center text-gray-300">
                <span className="text-green-400 mr-3">✓</span>
                ~416 generations
              </li>
              <li className="flex items-center text-gray-300">
                <span className="text-green-400 mr-3">✓</span>
                All Pro features
              </li>
              <li className="flex items-center text-gray-300">
                <span className="text-green-400 mr-3">✓</span>
                Advanced AI models
              </li>
              <li className="flex items-center text-gray-300">
                <span className="text-green-400 mr-3">✓</span>
                API access
              </li>
              <li className="flex items-center text-gray-300">
                <span className="text-green-400 mr-3">✓</span>
                Commercial license
              </li>
            </ul>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => startCheckout('subscription', 'price_creator_month')}
              disabled={loading === 'price_creator_month'}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
            >
              {loading === 'price_creator_month' ? 'Loading...' : 'Subscribe to Creator'}
            </motion.button>
          </motion.div>
        </div>

        {/* Credit Top-Up Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20"
        >
          <h3 className="text-2xl font-semibold text-white mb-6 text-center">Buy More Credits</h3>
          <div className="flex items-center justify-center gap-6">
            <div className="text-center">
              <p className="text-gray-300 mb-2">1,000 Credits</p>
              <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-cyan-400 mb-4">$5</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => startCheckout('topup', 'price_topup_1k')}
                disabled={loading === 'price_topup_1k'}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-cyan-500 text-white font-semibold hover:from-pink-600 hover:to-cyan-600 transition-all disabled:opacity-50"
              >
                {loading === 'price_topup_1k' ? 'Loading...' : 'Buy Credits'}
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-gray-400 mb-4">
            Questions? We're here to help
          </p>
          <motion.a
            href="/"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block px-6 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all"
          >
            ← Back to Home
          </motion.a>
        </motion.div>
      </div>
    </div>
  );
}

