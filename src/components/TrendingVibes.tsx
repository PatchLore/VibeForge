'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface TrendingVibesProps {
  onVibeSelect: (vibe: string) => void;
}

interface TrendingVibe {
  id: string;
  title: string;
  description: string;
  emoji: string;
  color: string;
  popularity: number;
}

// Fallback static vibes for when no community data is available
const fallbackVibes: TrendingVibe[] = [
  {
    id: 'heartbroken-city',
    title: 'Heartbroken in the City',
    description: 'Urban melancholy with rain-soaked streets',
    emoji: '🌧️',
    color: 'from-blue-500 to-purple-500',
    popularity: 95
  },
  {
    id: 'feeling-infinite',
    title: 'Feeling Infinite',
    description: 'Boundless energy and cosmic wonder',
    emoji: '✨',
    color: 'from-cyan-500 to-pink-500',
    popularity: 88
  },
  {
    id: 'midnight-drive',
    title: 'Midnight Drive',
    description: 'Neon-lit highways and late-night thoughts',
    emoji: '🌃',
    color: 'from-purple-500 to-pink-500',
    popularity: 92
  },
  {
    id: 'nostalgic-summer',
    title: 'Nostalgic Summer',
    description: 'Warm memories of endless golden days',
    emoji: '☀️',
    color: 'from-yellow-500 to-orange-500',
    popularity: 87
  },
  {
    id: 'rebellious-spirit',
    title: 'Rebellious Spirit',
    description: 'Defiant energy and breaking free',
    emoji: '🔥',
    color: 'from-red-500 to-pink-500',
    popularity: 83
  },
  {
    id: 'melancholy-dreams',
    title: 'Melancholy Dreams',
    description: 'Soft sadness with ethereal beauty',
    emoji: '🌙',
    color: 'from-indigo-500 to-purple-500',
    popularity: 90
  },
  {
    id: 'euphoric-dance',
    title: 'Euphoric Dance',
    description: 'Ecstatic joy and rhythmic celebration',
    emoji: '💃',
    color: 'from-pink-500 to-cyan-500',
    popularity: 85
  },
  {
    id: 'introspective-night',
    title: 'Introspective Night',
    description: 'Deep thoughts under starlit skies',
    emoji: '🌌',
    color: 'from-slate-500 to-blue-500',
    popularity: 89
  }
];

// Emoji mapping for moods
const moodEmojis: Record<string, string> = {
  calm: '🌊',
  energetic: '⚡',
  dark: '🌑',
  dreamy: '💭',
  serene: '🌸',
  nostalgic: '📸',
  futuristic: '🚀',
  romantic: '💕',
  mysterious: '🔮',
  euphoric: '🎉',
  melancholy: '🌙',
  cosmic: '✨',
  urban: '🏙️',
  nature: '🌿',
  neon: '💫',
  cinematic: '🎬',
  heartbroken: '💔',
  infinite: '♾️',
  midnight: '🌃',
  summer: '☀️',
  rebellious: '🔥',
  dance: '💃',
  introspective: '🤔'
};

// Color mapping for moods
const moodColors: Record<string, string> = {
  calm: 'from-blue-500 to-purple-500',
  energetic: 'from-yellow-500 to-orange-500',
  dark: 'from-gray-500 to-black',
  dreamy: 'from-pink-500 to-purple-500',
  serene: 'from-green-500 to-blue-500',
  nostalgic: 'from-yellow-500 to-orange-500',
  futuristic: 'from-cyan-500 to-blue-500',
  romantic: 'from-pink-500 to-red-500',
  mysterious: 'from-purple-500 to-indigo-500',
  euphoric: 'from-pink-500 to-cyan-500',
  melancholy: 'from-indigo-500 to-purple-500',
  cosmic: 'from-cyan-500 to-pink-500',
  urban: 'from-gray-500 to-blue-500',
  nature: 'from-green-500 to-emerald-500',
  neon: 'from-pink-500 to-cyan-500',
  cinematic: 'from-purple-500 to-pink-500',
  heartbroken: 'from-blue-500 to-purple-500',
  infinite: 'from-cyan-500 to-pink-500',
  midnight: 'from-purple-500 to-pink-500',
  summer: 'from-yellow-500 to-orange-500',
  rebellious: 'from-red-500 to-pink-500',
  dance: 'from-pink-500 to-cyan-500',
  introspective: 'from-slate-500 to-blue-500'
};

export default function TrendingVibes({ onVibeSelect }: TrendingVibesProps) {
  const [trendingVibes, setTrendingVibes] = useState<TrendingVibe[]>(fallbackVibes);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTrendingVibes = async () => {
      try {
        const response = await fetch('/api/tracks/popular');
        const data = await response.json();
        
        if (data.moods && data.moods.length > 0) {
          // Convert API data to TrendingVibe format
          const dynamicVibes: TrendingVibe[] = data.moods.map((mood: any, index: number) => ({
            id: mood.mood,
            title: mood.mood.charAt(0).toUpperCase() + mood.mood.slice(1),
            description: `Community-generated ${mood.mood} vibes`,
            emoji: moodEmojis[mood.mood] || '🎵',
            color: moodColors[mood.mood] || 'from-pink-500 to-cyan-500',
            popularity: mood.popularity
          }));
          
          setTrendingVibes(dynamicVibes);
        }
      } catch (error) {
        console.error('Failed to fetch trending vibes:', error);
        // Keep fallback vibes
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrendingVibes();
  }, []);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-light text-white mb-2">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-cyan-400">
            🔥 Live Trending Vibes
          </span>
        </h3>
        <p className="text-gray-300">Popular emotional soundscapes people are forging</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20 animate-pulse">
              <div className="h-8 bg-white/20 rounded mb-3"></div>
              <div className="h-4 bg-white/20 rounded mb-2"></div>
              <div className="h-4 bg-white/20 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {trendingVibes.map((vibe, index) => (
          <motion.div
            key={vibe.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onVibeSelect(vibe.title.toLowerCase())}
            className="group cursor-pointer"
          >
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 h-full">
              {/* Popularity Badge */}
              <div className="flex justify-between items-start mb-3">
                <div className="text-2xl">{vibe.emoji}</div>
                <div className="flex items-center space-x-1 text-xs text-gray-300">
                  <svg className="w-3 h-3 text-pink-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span>{vibe.popularity}%</span>
                </div>
              </div>

              {/* Vibe Content */}
              <div className="space-y-2">
                <h4 className="font-semibold text-white text-sm group-hover:text-pink-300 transition-colors">
                  {vibe.title}
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {vibe.description}
                </p>
              </div>

              {/* Gradient Accent */}
              <div className={`mt-3 h-1 rounded-full bg-gradient-to-r ${vibe.color} opacity-60 group-hover:opacity-100 transition-opacity`} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* View More Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="text-center"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500/20 to-cyan-500/20 border border-pink-500/30 text-pink-300 hover:from-pink-500/30 hover:to-cyan-500/30 transition-all"
        >
          View All Trending Vibes
        </motion.button>
      </motion.div>
    </div>
  );
}

