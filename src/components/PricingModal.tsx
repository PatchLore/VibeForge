'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PricingModal({ isOpen, onClose }: PricingModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const plans = [
    {
      id: 'free',
      name: 'Free',
      emoji: '🆓',
      price: '$0',
      period: 'Forever free',
      description: 'Get started with 3 free AI music or art generations daily.',
      features: [
        '3 free generations per day',
        'Limited access to Infinite Vibes feed',
        'Basic audio quality',
        'Community Radio access',
        'No credit card required'
      ],
      button: {
        text: 'Start Free',
        href: '/',
        type: 'link' as const
      },
      popular: false,
      comingSoon: false
    },
    {
      id: 'pro',
      name: 'Pro',
      emoji: '💎',
      price: '$9.99',
      period: 'per month',
      description: 'Unlimited AI music & art generation with premium features.',
      features: [
        'Unlimited AI music & art generation',
        'Full access to Infinite Vibes Discovery feed',
        'Download MP3, PNG, and MP4 files',
        'Priority generation speed',
        'Community Radio playlist rotation',
        'Cloud storage for your creations'
      ],
      button: {
        text: 'Upgrade to Pro',
        action: () => startCheckout('pro'),
        type: 'action' as const
      },
      popular: true,
      comingSoon: false
    },
    {
      id: 'creator',
      name: 'Creator',
      emoji: '🚀',
      price: '$19.99',
      period: 'per month',
      description: 'Designed for frequent creators & content producers.',
      features: [
        'Higher quality audio + HD artwork generation',
        'Your tracks eligible for Community Radio spotlight',
        'Early access to new Vibes & exclusive effects',
        '10,000 monthly credits included',
        'Advanced AI models',
        'Commercial license included'
      ],
      button: {
        text: 'Get Creator',
        action: () => startCheckout('creator'),
        type: 'action' as const
      },
      popular: false,
      comingSoon: false
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      emoji: '🏢',
      price: 'Custom',
      period: 'Contact us',
      description: 'For studios, teams, and platforms integrating Soundswoop tech.',
      features: [
        'Dedicated API access',
        'Bulk credits + private generation servers',
        'Advanced analytics and custom features',
        'White-label solutions',
        'Priority support',
        'Custom integrations'
      ],
      button: {
        text: 'Contact Us',
        href: 'mailto:enterprise@soundswoop.com',
        type: 'link' as const
      },
      popular: false,
      comingSoon: true
    }
  ];

  const startCheckout = async (planId: string) => {
    if (!user) {
      // Redirect to login if not authenticated
      window.location.href = '/auth/login?redirect=/pricing';
      return;
    }

    setLoading(planId);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId })
      });

      const data = await response.json();

      if (data.error) {
        alert(data.error);
        setLoading(null);
      } else if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
      setLoading(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="bg-gradient-to-br from-slate-900 via-purple-900 to-cyan-900 rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto border border-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-br from-slate-900/95 via-purple-900/95 to-cyan-900/95 backdrop-blur-md border-b border-white/20 z-10 p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">
                      Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-cyan-400">Plan</span>
                    </h2>
                    <p className="text-white/70">Unlock the full power of AI Mood Music Studio</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-white/70 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Pricing Cards */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {plans.map((plan) => (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: plans.indexOf(plan) * 0.1 }}
                      className={`relative rounded-2xl p-6 border-2 transition-all ${
                        plan.popular
                          ? 'bg-gradient-to-br from-purple-900/50 to-cyan-900/50 border-pink-500/50 shadow-lg shadow-pink-500/20'
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                      } ${plan.comingSoon ? 'opacity-60' : ''}`}
                    >
                      {plan.popular && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <span className="bg-gradient-to-r from-pink-500 to-cyan-500 text-white text-xs font-semibold px-4 py-1 rounded-full">
                            Most Popular
                          </span>
                        </div>
                      )}
                      {plan.comingSoon && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <span className="bg-white/20 text-white text-xs font-semibold px-4 py-1 rounded-full">
                            Coming Soon
                          </span>
                        </div>
                      )}

                      <div className="text-center mb-6">
                        <div className="text-4xl mb-4">{plan.emoji}</div>
                        <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                        <div className="flex items-baseline justify-center gap-2 mb-2">
                          <span className="text-4xl font-bold text-white">{plan.price}</span>
                          <span className="text-white/60 text-sm">{plan.period}</span>
                        </div>
                        <p className="text-white/70 text-sm">{plan.description}</p>
                      </div>

                      <ul className="space-y-3 mb-6">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-white/80 text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {plan.button.type === 'link' ? (
                        <a
                          href={plan.button.href}
                          className={`w-full block text-center py-3 px-6 rounded-xl font-semibold transition-all ${
                            plan.popular
                              ? 'bg-gradient-to-r from-pink-500 to-cyan-500 text-white hover:opacity-90'
                              : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                          }`}
                        >
                          {plan.button.text}
                        </a>
                      ) : (
                        <button
                          onClick={plan.button.action}
                          disabled={loading === plan.id || plan.comingSoon}
                          className={`w-full py-3 px-6 rounded-xl font-semibold transition-all ${
                            plan.popular
                              ? 'bg-gradient-to-r from-pink-500 to-cyan-500 text-white hover:opacity-90'
                              : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                          } ${loading === plan.id || plan.comingSoon ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {loading === plan.id ? (
                            <span className="flex items-center justify-center gap-2">
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              Processing...
                            </span>
                          ) : (
                            plan.button.text
                          )}
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Buy More Credits Section */}
                <div className="mt-8 p-6 bg-white/5 rounded-2xl border border-white/10">
                  <h3 className="text-xl font-bold text-white mb-4 text-center">Buy More Credits</h3>
                  <div className="max-w-md mx-auto">
                    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                      <div className="text-center mb-4">
                        <h4 className="text-2xl font-bold text-white mb-2">1,000 Credits</h4>
                        <div className="text-3xl font-bold text-white mb-4">$5</div>
                      </div>
                      <button
                        onClick={() => startCheckout('topup_1k')}
                        disabled={loading === 'topup_1k'}
                        className="w-full py-3 px-6 rounded-xl font-semibold bg-gradient-to-r from-pink-500 to-cyan-500 text-white hover:opacity-90 transition-all disabled:opacity-50 cursor-not-allowed"
                      >
                        {loading === 'topup_1k' ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Processing...
                          </span>
                        ) : (
                          'Buy Credits'
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center text-white/60 text-sm">
                  <p>All plans include a 14-day money-back guarantee. Cancel anytime.</p>
                  <p className="mt-2">
                    Need help? <a href="mailto:support@soundswoop.com" className="text-pink-400 hover:text-pink-300">Contact Support</a>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

