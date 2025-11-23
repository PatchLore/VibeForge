"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useEffect, useState } from "react";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function init() {
      try {
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
  }, [supabase]);

  if (!isReady) return null; // Prevent chunk load crash
  return <>{children}</>;
}
