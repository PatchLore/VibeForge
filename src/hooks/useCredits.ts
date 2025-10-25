'use client';

import { useState, useEffect } from 'react';

interface UserCredits {
  credits: number;
  plan: string;
  email?: string;
}

export function useCredits(userId: string | null) {
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchCredits = async () => {
      try {
        const response = await fetch(`/api/credits?userId=${userId}`);
        const data = await response.json();
        setCredits(data);
      } catch (error) {
        console.error('Error fetching credits:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCredits();
    
    // Refresh credits every 30 seconds
    const interval = setInterval(fetchCredits, 30000);
    
    return () => clearInterval(interval);
  }, [userId]);

  return { credits, loading, refetch: () => {
    if (userId) {
      fetch(`/api/credits?userId=${userId}`)
        .then(res => res.json())
        .then(data => setCredits(data));
    }
  }};
}

