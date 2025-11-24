'use client';

import React, { useState } from 'react';

export interface LoRA {
  name: string;
  id: string;
  style?: string;
}

export const LORAS: LoRA[] = [
  { name: "Detail Tweaker XL", id: "civitai:122359@135867", style: "Intensity / Grit" },
  { name: "SDXL Inkdrawing", id: "civitai:154918@173694", style: "Raw Emotion" },
  { name: "Cinematic Warm Light XL", id: "civitai:290860@592197", style: "Nostalgia & Comfort" },
  { name: "Fine Tuned Detailed Eyes", id: "civitai:316969@355491", style: "Realistic Emotion" },
  { name: "Vibrant Watercolor", id: "civitai:1200817@1352135", style: "Soft Dreaminess" }
];

export interface SelectedLoRA {
  id: string;
  strength: number;
}

export function extractModelId(airId: string): string {
  return airId.split("@")[0].replace("civitai:", "");
}

interface LoraSelectorProps {
  selected: SelectedLoRA[];
  onChange: (loras: SelectedLoRA[]) => void;
}

export default function LoraSelector({ selected, onChange }: LoraSelectorProps) {
  const handleToggle = (lora: LoRA) => {
    const existingIndex = selected.findIndex(s => s.id === lora.id);
    if (existingIndex >= 0) {
      // Remove if already selected
      onChange(selected.filter((_, i) => i !== existingIndex));
    } else {
      // Add with default strength
      onChange([...selected, { id: lora.id, strength: 0.7 }]);
    }
  };

  const handleStrengthChange = (loraId: string, strength: number) => {
    onChange(selected.map(l => l.id === loraId ? { ...l, strength } : l));
  };

  return (
    <div>
      <label className="font-semibold text-white block mb-2">LoRA Styles</label>
      <div className="space-y-3">
        {LORAS.map((lora) => {
          const isSelected = selected.some(s => s.id === lora.id);
          const selectedLoRA = selected.find(s => s.id === lora.id);
          
          return (
            <div
              key={lora.id}
              className={`p-3 rounded-lg border ${
                isSelected
                  ? 'bg-pink-500/20 border-pink-500/50'
                  : 'bg-black/20 border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggle(lora)}
                    className="w-4 h-4 rounded border-white/20 bg-black/20 text-pink-500 focus:ring-pink-500"
                  />
                  <div>
                    <div className="text-white font-medium">{lora.name}</div>
                    {lora.style && (
                      <div className="text-xs text-white/60">{lora.style}</div>
                    )}
                  </div>
                </div>
              </div>
              
              {isSelected && selectedLoRA && (
                <div className="mt-2 pl-6">
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-white/70">Strength:</label>
                    <input
                      type="range"
                      min={0.1}
                      max={1.5}
                      step={0.1}
                      value={selectedLoRA.strength}
                      onChange={(e) => handleStrengthChange(lora.id, parseFloat(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-xs text-white/70 w-8 text-right">
                      {selectedLoRA.strength.toFixed(1)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


