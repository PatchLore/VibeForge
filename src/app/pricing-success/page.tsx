'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

function PricingSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [user, setUser] = useState<any>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user data
        if (supabase) {
          const { data: { user } } = await supabase.auth.getUser();
          setUser(user);
        }
        
        // Fetch session details if session_id is available
        if (sessionId) {
          try {
            const response = await fetch(`/api/retrieve-checkout-session?session_id=${sessionId}`);
            if (response.ok) {
              const sessionData = await response.json();
              setSessionData(sessionData);
            } else {
              const errorData = await response.json();
              setError(errorData.error || 'Failed to retrieve session details');
            }
          } catch (error) {
            console.error('Error fetching session details:', error);
            setError('Failed to retrieve session details');
          }
        } else {
          setError('No session ID provided');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load subscription details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-pink-900 to-cyan-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <div className="text-white text-xl">Retrieving your subscription details…</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-pink-900 to-cyan-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full text-center"
        >
          <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
            <div className="text-6xl mb-6">⚠️</div>
            <h1 className="text-3xl font-semibold text-white mb-4">
              Subscription Details Not Found
            </h1>
            <p className="text-gray-300 text-lg mb-8">
              We couldn't find your subscription details. Please contact support.
            </p>
            <div className="space-y-4">
              <motion.a
                href="mailto:support@soundswoop.com"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-block px-8 py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-cyan-500 text-white font-semibold hover:from-pink-600 hover:to-cyan-600 transition-all"
              >
                Contact Support
              </motion.a>
              <div>
                <motion.a
                  href="/pricing"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-block px-6 py-3 rounded-xl bg-white/20 text-white font-semibold hover:bg-white/30 transition-all"
                >
                  Back to Pricing
                </motion.a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Dynamic title based on plan
  const planName = sessionData?.plan_name || '';
  const title = planName.toLowerCase().includes("creator")
    ? "Welcome to Soundswoop Creator!"
    : planName.toLowerCase().includes("pro")
    ? "Welcome to Soundswoop Pro!"
    : "Welcome to Soundswoop!";

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
            {title}
          </h1>
          
          <p className="text-gray-300 text-lg mb-8">
            Your subscription is active. You can now generate unlimited AI music and art with enhanced features.
          </p>

          {/* Summary Box */}
          <div className="bg-white/5 backdrop-blur-lg p-6 rounded-2xl mt-6 text-gray-200 space-y-2">
            <h3 className="text-xl font-semibold text-white mb-4">Subscription Details</h3>
            <p><strong>Plan:</strong> {sessionData?.plan_name || 'N/A'}</p>
            <p><strong>Email:</strong> {sessionData?.customer_email || user?.email || 'N/A'}</p>
            <p><strong>Status:</strong> 
              <span className={`ml-2 ${sessionData?.payment_status === 'paid' ? 'text-green-400' : 'text-yellow-400'}`}>
                {sessionData?.payment_status || 'Processing'}
              </span>
            </p>
            <p><strong>Activated:</strong> {sessionData?.created_at ? new Date(sessionData.created_at).toLocaleDateString() : new Date().toLocaleDateString()}</p>
            {sessionData?.amount_total && (
              <p><strong>Amount:</strong> ${(sessionData.amount_total / 100).toFixed(2)} {sessionData.currency?.toUpperCase() || 'USD'}</p>
            )}
            {sessionId && (
              <p><strong>Session ID:</strong> <code className="text-pink-400 text-sm">{sessionId.slice(0, 8)}...</code></p>
            )}
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
