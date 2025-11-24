'use client';

import React, { useEffect, useState } from "react";
import { MODELS, LORA_SUPPORTED } from "@/data/models";
import AspectRatioSelector, { aspectResolutionMap } from "./AspectRatioSelector";
import LoraSelector, { SelectedLoRA } from "./LoraSelector";
import EmotionalPresets, { EmotionalPreset } from "./EmotionalPresets";
import GenerationHistory, { HistoryItem } from "./GenerationHistory";

export default function AIAssetGenerator() {
  const [selectedModelId, setSelectedModelId] = useState<string | null>(MODELS[0]?.value ?? null);
  const [selectedLoras, setSelectedLoras] = useState<SelectedLoRA[]>([]);
  const [prompt, setPrompt] = useState("");
  const [aspect, setAspect] = useState("1:1");
  const [steps, setSteps] = useState<number | undefined>(undefined);
  const [seed, setSeed] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [imageResult, setImageResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Derive the selected model
  const selectedModel = MODELS.find(m => m.value === selectedModelId) ?? MODELS[0];
  const supportsLora = selectedModelId ? LORA_SUPPORTED[selectedModelId] ?? false : false;

  // Get width/height from aspect ratio
  const { width, height } = aspectResolutionMap[aspect] || { width: 1024, height: 1024 };

  useEffect(() => {
    // Initialize with first model
    if (MODELS.length > 0 && !selectedModelId) {
      setSelectedModelId(MODELS[0].value);
    }
  }, []);

  const applyPreset = (preset: EmotionalPreset) => {
    setPrompt(preset.prompt);
    setAspect(preset.aspect);
    setSelectedLoras(preset.loras);
  };

  const regenerateWith = (item: HistoryItem) => {
    setPrompt(item.prompt);
    setAspect(item.aspect);
    setSelectedLoras(item.loras);
    // Trigger generation after a short delay to allow state to update
    setTimeout(() => {
      handleGenerate();
    }, 100);
  };

  async function handleGenerate() {
    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }
    if (!selectedModel || !selectedModelId) {
      setError("Please select a model");
      return;
    }

    setLoading(true);
    setImageResult(null);
    setError(null);

    try {
      console.log('🚀 [AIAssetGenerator] Starting image generation');
      console.log('  Model:', selectedModelId);
      console.log('  Model Label:', selectedModel.label);
      console.log('  Prompt:', prompt);
      console.log('  Selected LoRAs:', selectedLoras.length);
      console.log('  Aspect:', aspect);
      console.log('  Width:', width);
      console.log('  Height:', height);
      console.log('  Steps:', steps);
      console.log('  Seed:', seed);
      
      // Build request body with new format
      const requestBody: any = {
        prompt,
        modelId: selectedModelId,
        aspect,
        width,
        height,
        loras: selectedLoras,
        steps,
        seed,
      };

      // Call the unified image generation API
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.image) {
        throw new Error('No image data in response');
      }
      
      console.log('✅ [AIAssetGenerator] Image generated successfully');
      console.log('  Image data length:', data.image.length, 'characters');
      console.log('  Image format:', data.image.substring(0, 30) + '...');
      
      setImageResult(data.image);

      // Add to history
      const historyItem: HistoryItem = {
        image: data.image,
        prompt,
        loras: selectedLoras,
        aspect,
        timestamp: Date.now(),
      };
      setHistory(prev => [historyItem, ...prev].slice(0, 20));
    } catch (error: any) {
      console.error('❌ [AIAssetGenerator] Image generation failed:', error);
      setError(error.message || "Image generation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-3xl font-bold text-white">AI Asset Generator</h2>

      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
          {error}
        </div>
      )}

      <div>
        <label className="font-semibold text-white block mb-2">Prompt</label>
        <textarea
          className="w-full p-3 bg-black/20 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          placeholder="Describe the artwork you want to generate..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
        />
      </div>

      <EmotionalPresets onSelect={applyPreset} />

      <div>
        <label className="font-semibold text-white block mb-2">Model</label>
        <select
          className="w-full p-2 mt-1 bg-black/20 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          value={selectedModelId || ''}
          onChange={(e) => setSelectedModelId(e.target.value)}
        >
          {MODELS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>

      <AspectRatioSelector aspect={aspect} onChange={setAspect} />

      {supportsLora && (
        <LoraSelector selected={selectedLoras} onChange={setSelectedLoras} />
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="font-semibold text-white block mb-2">Steps (optional)</label>
          <input
            type="number"
            className="w-full p-2 bg-black/20 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            value={steps || ''}
            onChange={(e) => setSteps(e.target.value ? parseInt(e.target.value) : undefined)}
            min={1}
            max={50}
            placeholder="Auto"
          />
        </div>
        <div>
          <label className="font-semibold text-white block mb-2">Seed (optional)</label>
          <input
            type="number"
            className="w-full p-2 bg-black/20 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            value={seed || ''}
            onChange={(e) => setSeed(e.target.value ? parseInt(e.target.value) : undefined)}
            min={0}
            placeholder="Random"
          />
        </div>
      </div>

      <button
        className="px-6 py-3 bg-gradient-to-r from-pink-500 to-cyan-500 rounded-lg hover:from-pink-600 hover:to-cyan-600 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={loading || !prompt.trim() || !selectedModel}
        onClick={handleGenerate}
      >
        {loading ? "Generating..." : "Generate Image"}
      </button>

      {imageResult && (
        <div className="pt-6">
          <div className="bg-black/20 border border-white/20 rounded-lg p-4">
            <img 
              src={imageResult} 
              alt="Generated artwork" 
              className="max-w-full rounded-lg shadow-lg mb-4" 
            />
            <a
              href={imageResult}
              download="soundswoop-generated.png"
              className="inline-block px-4 py-2 bg-gradient-to-r from-pink-500 to-cyan-500 rounded-lg text-white hover:from-pink-600 hover:to-cyan-600 transition-all"
            >
              Download Image
            </a>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="pt-6">
          <GenerationHistory history={history} onRegenerate={regenerateWith} />
        </div>
      )}
    </div>
  );
}
