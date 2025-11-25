'use client';

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const supabase = getSupabaseBrowserClient();
        if (!supabase) {
          setIsReady(true);
          return;
        }

        const { data, error } = await supabase.auth.getSession();

        // If refresh token is invalid → reset everything
        if (error?.message?.includes("Refresh Token")) {
          await supabase.auth.signOut();
          console.warn("Resetting auth due to invalid refresh token.");
        }
      } catch (e) {
        console.warn("AuthProvider init error:", e);
      } finally {
        // Avoid layout.js ChunkLoadError
        setIsReady(true);
      }
    }

    init();
  }, []);

  if (!isReady) return null; // Prevent chunk load crash
  return <>{children}</>;
}
