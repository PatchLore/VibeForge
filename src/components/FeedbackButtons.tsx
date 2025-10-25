'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { track } from '@vercel/analytics';

interface FeedbackButtonsProps {
  trackId: string;
}

export default function FeedbackButtons({ trackId }: FeedbackButtonsProps) {
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFeedback = async (vote: 'up' | 'down') => {
    if (feedbackSubmitted || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trackId,
          vote,
          timestamp: new Date().toISOString()
        }),
      });

      if (response.ok) {
        setFeedbackSubmitted(true);
        track('Feedback Submitted', { trackId, vote });
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <p className="text-sm text-gray-400">Did you like this track?</p>
      <div className="flex gap-2">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => handleFeedback('up')}
          disabled={feedbackSubmitted || isSubmitting}
          className={`p-2 rounded-lg transition-all ${
            feedbackSubmitted 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-white/10 hover:bg-green-500/20 text-gray-300 hover:text-green-400'
          }`}
        >
          👍
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => handleFeedback('down')}
          disabled={feedbackSubmitted || isSubmitting}
          className={`p-2 rounded-lg transition-all ${
            feedbackSubmitted 
              ? 'bg-red-500/20 text-red-400' 
              : 'bg-white/10 hover:bg-red-500/20 text-gray-300 hover:text-red-400'
          }`}
        >
          👎
        </motion.button>
      </div>
      {feedbackSubmitted && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-green-400"
        >
          Thanks for your feedback!
        </motion.p>
      )}
    </div>
  );
}

