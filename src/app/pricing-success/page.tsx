'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  : null;

function PricingSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [user, setUser] = useState<any>(null);
  const [planType, setPlanType] = useState<string>('Pro');
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        // Try to fetch session details if session_id is available
        if (sessionId) {
          try {
            const response = await fetch(`/api/retrieve-checkout-session?session_id=${sessionId}`);
            if (response.ok) {
              const sessionData = await response.json();
              setSessionData(sessionData);
              if (sessionData.plan_name) {
                setPlanType(sessionData.plan_name.replace('Soundswoop ', ''));
              }
            }
          } catch (error) {
            console.log('Could not fetch session details:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-pink-900 to-cyan-900 flex items-center justify-center p-4">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-pink-900 to-cyan-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl w-full text-center"
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="flex justify-center mb-8"
        >
          <div className="relative">
            <CheckCircle className="w-24 h-24 text-green-400" />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4 }}
              className="absolute inset-0 bg-green-400/20 rounded-full blur-xl"
            />
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-cyan-500/10 to-violet-500/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Welcome to Soundswoop {planType}!
          </h1>
          
          <p className="text-gray-300 text-lg mb-8">
            Your subscription is active. You can now generate unlimited AI music and art with enhanced features.
          </p>

          {/* Summary Box */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-4">Subscription Details</h3>
            <div className="space-y-3 text-left">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Plan:</span>
                <span className="text-white font-semibold">{sessionData?.plan_name || planType}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Email:</span>
                <span className="text-white font-semibold">{sessionData?.customer_email || user?.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Amount:</span>
                <span className="text-white font-semibold">
                  ${sessionData?.amount_total ? (sessionData.amount_total / 100).toFixed(2) : '0.00'} {sessionData?.currency?.toUpperCase() || 'USD'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Status:</span>
                <span className={`font-semibold ${sessionData?.payment_status === 'paid' ? 'text-green-400' : 'text-yellow-400'}`}>
                  {sessionData?.payment_status || 'Processing'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Activated:</span>
                <span className="text-white font-semibold">
                  {sessionData?.created_at ? new Date(sessionData.created_at).toLocaleDateString() : new Date().toLocaleDateString()}
                </span>
              </div>
              {sessionId && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Session ID:</span>
                  <code className="text-pink-400 text-sm">{sessionId.slice(0, 8)}...</code>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.a
              href="/dashboard"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white/10 backdrop-blur-lg hover:bg-white/20 rounded-2xl px-6 py-3 transition-all text-white font-semibold border border-white/20"
            >
              Go to Dashboard
            </motion.a>
            
            <motion.a
              href="/"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white/10 backdrop-blur-lg hover:bg-white/20 rounded-2xl px-6 py-3 transition-all text-white font-semibold border border-white/20"
            >
              Explore More Vibes
            </motion.a>
          </div>
        </motion.div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <p className="text-gray-400 text-sm">
            Need help? Contact us at{' '}
            <a href="mailto:support@soundswoop.com" className="text-pink-400 hover:text-pink-300 transition-colors">
              support@soundswoop.com
            </a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function PricingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-pink-900 to-cyan-900 flex items-center justify-center p-4">
        <div className="text-white text-xl">Loading...</div>
      </div>
    }>
      <PricingSuccessContent />
    </Suspense>
  );
}
