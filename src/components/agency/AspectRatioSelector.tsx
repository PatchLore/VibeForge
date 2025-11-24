'use client';

import React from 'react';

export const ASPECT_RATIOS = [
  { label: "1:1", value: "1:1" },
  { label: "9:16", value: "9:16" },
  { label: "16:9", value: "16:9" },
  { label: "3:2", value: "3:2" },
  { label: "2:3", value: "2:3" }
];

export const aspectResolutionMap: Record<string, { width: number; height: number }> = {
  "1:1":   { width: 1024, height: 1024 },
  "9:16":  { width: 768,  height: 1344 },
  "16:9":  { width: 1344, height: 768 },
  "3:2":   { width: 1216, height: 832 },
  "2:3":   { width: 832,  height: 1216 }
};

interface AspectRatioSelectorProps {
  aspect: string;
  onChange: (aspect: string) => void;
}

export default function AspectRatioSelector({ aspect, onChange }: AspectRatioSelectorProps) {
  return (
    <div>
      <label className="font-semibold text-white block mb-2">Aspect Ratio</label>
      <div className="flex flex-wrap gap-2">
        {ASPECT_RATIOS.map((ratio) => (
          <button
            key={ratio.value}
            onClick={() => onChange(ratio.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              aspect === ratio.value
                ? 'bg-gradient-to-r from-pink-500 to-cyan-500 text-white shadow-lg'
                : 'bg-black/20 border border-white/20 text-white hover:bg-white/10'
            }`}
          >
            {ratio.label}
          </button>
        ))}
      </div>
    </div>
  );
}


