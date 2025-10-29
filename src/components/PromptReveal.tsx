'use client';

import { useState } from 'react';

interface PromptRevealProps {
  musicPrompt?: string | null;
  imagePrompt?: string | null;
}

export default function PromptReveal({ musicPrompt, imagePrompt }: PromptRevealProps) {
  const [open, setOpen] = useState(false);
  const hasAny = !!(musicPrompt || imagePrompt);
  if (!hasAny) return null;

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="text-xs text-pink-300 hover:text-white transition-colors"
      >
        {open ? 'Hide prompts' : 'Show prompts'}
      </button>
      {open && (
        <div className="mt-2 space-y-1 text-xs text-gray-300">
          {musicPrompt && (
            <div>
              <span className="text-pink-400">Music:</span> <span className="whitespace-pre-wrap">{musicPrompt}</span>
            </div>
          )}
          {imagePrompt && (
            <div>
              <span className="text-cyan-400">Image:</span> <span className="whitespace-pre-wrap">{imagePrompt}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


