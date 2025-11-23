'use client';

import React, { useEffect, useState } from "react";
import { listModels, generateImage } from "../../services/aiService";
import { generateHFImage } from "../../services/hfInferenceService";
import { DeepInfraModel, AIProvider } from "../../types/aiTypes";
import { HF_MODELS } from "../../data/hfModels";

export default function AIAssetGenerator() {
  const [provider, setProvider] = useState<AIProvider>("deepinfra");
  const [models, setModels] = useState<DeepInfraModel[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageResult, setImageResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setError(null);
        if (provider === "deepinfra") {
          try {
            const m = await listModels();
            setModels(m);
            if (m.length > 0) setSelectedModel(m[0].id);
          } catch (err: any) {
            console.error("DeepInfra model load failed:", err);
            setError(`DeepInfra: ${err.message || "API key not configured. Please set NEXT_PUBLIC_DEEPINFRA_API_KEY."}`);
            setModels([]);
          }
        } else if (provider === "hf") {
          // HF models are static, no API call needed
          if (HF_MODELS.length > 0) {
            setSelectedModel(HF_MODELS[0].id);
          }
        }
      } catch (err: any) {
        console.error("Model load failed:", err);
        setError(err.message || "Failed to load models. Please check your API key configuration.");
      }
    }
    load();
  }, [provider]);

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
      let finalImage: string;

      if (provider === "deepinfra") {
        const result = await generateImage(prompt, selectedModel);
        finalImage = `data:image/png;base64,${result.imageBase64}`;
      } else if (provider === "hf") {
        finalImage = await generateHFImage(selectedModel, prompt);
      } else {
        throw new Error("Unknown provider");
      }

      setImageResult(finalImage);
    } catch (error: any) {
      console.error(error);
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
        <label className="font-semibold text-white block mb-2">Provider</label>
        <select
          className="w-full p-2 mt-1 bg-black/20 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          value={provider}
          onChange={(e) => {
            setProvider(e.target.value as AIProvider);
            setSelectedModel("");
            setImageResult(null);
            setError(null);
          }}
        >
          <option value="deepinfra">DeepInfra</option>
          <option value="hf">Cognaix / HF</option>
        </select>
      </div>

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
          disabled={provider === "deepinfra" ? models.length === 0 : false}
        >
          {provider === "deepinfra" ? (
            models.length === 0 ? (
              <option value="">Loading models...</option>
            ) : (
              models.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))
            )
          ) : (
            HF_MODELS.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))
          )}
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

