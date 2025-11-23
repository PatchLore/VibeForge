'use client';

import React, { useEffect, useState } from "react";
import { MODELS, LORA_SUPPORTED } from "@/data/models";
import { LORA_STYLES } from "@/lib/loraStyles";

export default function AIAssetGenerator() {
  const [selectedModelId, setSelectedModelId] = useState<string | null>(MODELS[0]?.value ?? null);
  const [selectedLoraId, setSelectedLoraId] = useState<string>("");
  const [loraStrength, setLoraStrength] = useState<number>(1.0);
  const [prompt, setPrompt] = useState("");
  const [width, setWidth] = useState<number>(1024);
  const [height, setHeight] = useState<number>(1024);
  const [steps, setSteps] = useState<number | undefined>(undefined);
  const [seed, setSeed] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [imageResult, setImageResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Derive the selected model
  const selectedModel = MODELS.find(m => m.value === selectedModelId) ?? MODELS[0];
  const supportsLora = selectedModelId ? LORA_SUPPORTED[selectedModelId] ?? false : false;
  
  // Get default scale for selected LoRA
  const selectedLora = LORA_STYLES.find(s => s.id === selectedLoraId);

  useEffect(() => {
    // Initialize with first model
    if (MODELS.length > 0 && !selectedModelId) {
      setSelectedModelId(MODELS[0].value);
    }
  }, []);

  // Update LoRA strength when LoRA changes
  useEffect(() => {
    if (selectedLora) {
      setLoraStrength(selectedLora.defaultScale);
    }
  }, [selectedLora]);

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
      console.log('  Selected LoRA:', selectedLoraId || 'None');
      console.log('  LoRA Strength:', loraStrength);
      console.log('  Width:', width);
      console.log('  Height:', height);
      console.log('  Steps:', steps);
      console.log('  Seed:', seed);
      
      // Build request body
      // Use the model value (e.g., "flux-schnell") - the API will resolve to actual provider/model
      const requestBody: any = {
        prompt,
        modelId: selectedModelId, // e.g., "flux-schnell", "seedream-xl", etc.
        provider: "deepinfra", // Will be overridden by API routing logic
        loraId: selectedLoraId || null,
        loraStrength: selectedLoraId ? loraStrength : null,
        width,
        height,
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

      {supportsLora && (
        <>
          <div>
            <label className="font-semibold text-white block mb-2">LoRA Style</label>
            <select
              value={selectedLoraId}
              onChange={(e) => setSelectedLoraId(e.target.value)}
              className="w-full rounded-lg bg-black/30 border border-white/10 p-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="">No LoRA</option>
              {LORA_STYLES.map((style) => (
                <option key={style.id} value={style.id}>
                  {style.label}
                </option>
              ))}
            </select>
          </div>

          {selectedLoraId && (
            <div>
              <label className="font-semibold text-white block mb-2">
                LoRA Strength: {loraStrength.toFixed(1)}
              </label>
              <input
                type="range"
                min={0}
                max={2.5}
                step={0.1}
                value={loraStrength}
                onChange={(e) => setLoraStrength(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0.0</span>
                <span>1.0</span>
                <span>2.5</span>
              </div>
            </div>
          )}
        </>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="font-semibold text-white block mb-2">Width</label>
          <input
            type="number"
            className="w-full p-2 bg-black/20 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            value={width}
            onChange={(e) => setWidth(parseInt(e.target.value) || 1024)}
            min={256}
            max={2048}
            step={64}
          />
        </div>
        <div>
          <label className="font-semibold text-white block mb-2">Height</label>
          <input
            type="number"
            className="w-full p-2 bg-black/20 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            value={height}
            onChange={(e) => setHeight(parseInt(e.target.value) || 1024)}
            min={256}
            max={2048}
            step={64}
          />
        </div>
      </div>

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
    </div>
  );
}
