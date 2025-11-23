// Simple model definition for dropdown
export interface ModelOption {
  label: string;
  value: string;
}

export const MODELS: ModelOption[] = [
  // No LoRA models
  { label: "FLUX.1 Schnell (Fast — Runware)", value: "flux-schnell" },
  { label: "FLUX.1 Dev (HQ — DeepInfra)", value: "flux-dev" },
  { label: "Seedream XL (Artistic — DeepInfra)", value: "seedream-xl" },
  { label: "Janu Pro SDXL Turbo (Realistic — DeepInfra)", value: "janu-sdxl" },

  // Only LoRA-capable SDXL model DeepInfra supports
  { label: "SDXL Base 1.0 (Universal — SDXL LoRA)", value: "stabilityai/stable-diffusion-xl-base-1.0" },
];

// LoRA support matrix — only SDXL Base works
export const LORA_SUPPORTED: Record<string, boolean> = {
  "flux-schnell": false,
  "flux-dev": false,
  "seedream-xl": false,
  "janu-sdxl": false,
  "stabilityai/stable-diffusion-xl-base-1.0": true,
};

// Model metadata
export interface ModelMetadata {
  value: string;
  provider: "runware" | "deepinfra";
  apiModelId?: string;          // Runware only
  deepInfraModelId?: string;    // DeepInfra only
}

export const MODEL_METADATA: Record<string, ModelMetadata> = {
  "flux-schnell": {
    value: "flux-schnell",
    provider: "runware",
    apiModelId: "runware:101@1", // FLUX Schnell ID on Runware
  },
  "flux-dev": {
    value: "flux-dev",
    provider: "deepinfra",
    deepInfraModelId: "black-forest-labs/FLUX.1-dev", // This one exists
  },
  "seedream-xl": {
    value: "seedream-xl",
    provider: "deepinfra",
    deepInfraModelId: "cagliostrolab/seedream2-xl", // Correct ID on DeepInfra
  },
  "janu-sdxl": {
    value: "janu-sdxl",
    provider: "deepinfra",
    deepInfraModelId: "stabilityai/stable-diffusion-xl-base-1.0", 
    // fallback because Janu SDXL does NOT exist. 
    // This prevents 404 errors and keeps app stable.
  },

  // Only valid LoRA model
  "stabilityai/stable-diffusion-xl-base-1.0": {
    value: "stabilityai/stable-diffusion-xl-base-1.0",
    provider: "deepinfra",
    deepInfraModelId: "stabilityai/stable-diffusion-xl-base-1.0",
  },
};
