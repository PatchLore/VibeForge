'use client';

import React, { useEffect, useState } from "react";
import { HF_MODELS } from "../../data/hfModels";

export default function AIAssetGenerator() {
  const [selectedModel, setSelectedModel] = useState("");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageResult, setImageResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load HF models on mount
    if (HF_MODELS.length > 0) {
      setSelectedModel(HF_MODELS[0].id);
    }
  }, []);

  async function handleGenerate() {
    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }
    if (!selectedModel) {
      setError("Please select a model");
      return;
    }

    setLoading(true);
    setImageResult(null);
    setError(null);

    try {
      console.log('🚀 [AIAssetGenerator] Starting image generation');
      console.log('  Model:', selectedModel);
      console.log('  Prompt:', prompt);
      
      // Call our server-side API route
      const response = await fetch('/api/hf/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelId: selectedModel,
          prompt: prompt,
        }),
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
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
        >
          {HF_MODELS.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
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

