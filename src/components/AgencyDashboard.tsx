'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import AIAssetGenerator from './agency/AIAssetGenerator';

type TabId = 'overview' | 'ai-generator' | 'settings';

export default function AgencyDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const tabStyle = "px-6 py-3 rounded-xl transition-all bg-white/20 text-gray-300 hover:bg-white/30";
  const activeTabStyle = "px-6 py-3 rounded-xl transition-all bg-gradient-to-r from-pink-500 to-cyan-500 text-white";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-pink-900 to-cyan-900 p-4">
      {/* Animated gradient orb backgrounds */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-cyan-400">
              Agency Dashboard
            </span>
          </h1>
          <p className="text-xl text-gray-400">
            Manage your agency tools and AI assets
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap gap-3 mb-8 justify-center"
        >
          <button
            onClick={() => setActiveTab('overview')}
            className={activeTab === 'overview' ? activeTabStyle : tabStyle}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('ai-generator')}
            className={activeTab === 'ai-generator' ? activeTabStyle : tabStyle}
          >
            AI Generator
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={activeTab === 'settings' ? activeTabStyle : tabStyle}
          >
            Settings
          </button>
        </motion.div>

        {/* Tab Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="auth-form-container"
        >
          {activeTab === 'overview' && (
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Overview</h2>
              <p className="text-gray-300">
                Welcome to the Agency Dashboard. Use the tabs above to navigate between different tools.
              </p>
            </div>
          )}

          {activeTab === 'ai-generator' && <AIAssetGenerator />}

          {activeTab === 'settings' && (
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Settings</h2>
              <p className="text-gray-300">
                Settings panel coming soon.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

