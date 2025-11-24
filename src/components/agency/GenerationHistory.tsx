'use client';

import React, { useState } from 'react';
import { SelectedLoRA } from './LoraSelector';

export interface HistoryItem {
  image: string;
  prompt: string;
  loras: SelectedLoRA[];
  aspect: string;
  timestamp: number;
}

interface GenerationHistoryProps {
  history: HistoryItem[];
  onRegenerate: (item: HistoryItem) => void;
}

export default function GenerationHistory({ history, onRegenerate }: GenerationHistoryProps) {
  const [enlargedIndex, setEnlargedIndex] = useState<number | null>(null);

  if (history.length === 0) {
    return null;
  }

  const handleDownload = (image: string, index: number) => {
    const link = document.createElement('a');
    link.href = image;
    link.download = `soundswoop-generated-${index}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <label className="font-semibold text-white block mb-2">Generation History</label>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {history.map((item, index) => (
          <div
            key={index}
            className="relative group bg-black/20 border border-white/20 rounded-lg overflow-hidden"
          >
            <img
              src={item.image}
              alt={`Generated ${index + 1}`}
              className="w-full h-32 object-cover cursor-pointer"
              onClick={() => setEnlargedIndex(enlargedIndex === index ? null : index)}
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                onClick={() => handleDownload(item.image, index)}
                className="px-3 py-1 bg-pink-500/80 text-white rounded text-xs hover:bg-pink-500"
              >
                Download
              </button>
              <button
                onClick={() => onRegenerate(item)}
                className="px-3 py-1 bg-cyan-500/80 text-white rounded text-xs hover:bg-cyan-500"
              >
                Regenerate
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Enlarged View Modal */}
      {enlargedIndex !== null && history[enlargedIndex] && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setEnlargedIndex(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={history[enlargedIndex].image}
              alt="Enlarged"
              className="max-w-full max-h-[90vh] rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setEnlargedIndex(null)}
              className="absolute top-4 right-4 bg-black/60 text-white px-4 py-2 rounded-lg hover:bg-black/80"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


