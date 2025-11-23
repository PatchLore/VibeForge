// Simple model definition for dropdown
export interface ModelOption {
  label: string;
  value: string;
}

export const MODELS: ModelOption[] = [
  // No LoRA models
  { label: "FLUX.1 Schnell (Fast — Runware)", value: "flux-schnell" },
  { label: "FLUX.1 Dev (HQ — DeepInfra)", value: "flux-dev" },

  // Artistic + Realistic (DeepInfra, NO LoRAs)
  { label: "Seedream XL (Artistic — DeepInfra)", value: "seedream-xl" },
  { label: "Janu Pro SDXL Turbo (Realistic — DeepInfra)", value: "janu-sdxl" },

  // The ONLY SDXL model DeepInfra hosts that supports LoRAs
  { label: "SDXL Turbo (Universal — SDXL LoRA)", value: "stabilityai/sdxl-turbo" },
];

// LoRA support matrix — only SDXL Turbo works
export const LORA_SUPPORTED: Record<string, boolean> = {
  "flux-schnell": false,
  "flux-dev": false,
  "seedream-xl": false,
  "janu-sdxl": false,

  // ONLY SDXL Turbo supports LoRAs on DeepInfra
  "stabilityai/sdxl-turbo": true,
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
    apiModelId: "runware:101@1",
  },
  "flux-dev": {
    value: "flux-dev",
    provider: "deepinfra",
    deepInfraModelId: "black-forest-labs/FLUX.1-dev",
  },
  "seedream-xl": {
    value: "seedream-xl",
    provider: "deepinfra",
    deepInfraModelId: "cagliostrolab/seedream2-xl",
  },
  "janu-sdxl": {
    value: "janu-sdxl",
    provider: "deepinfra",
    deepInfraModelId: "alionsonny/janus-pro-sdxl",
  },

  // LoRA model (must match DeepInfra exactly)
  "stabilityai/sdxl-turbo": {
    value: "stabilityai/sdxl-turbo",
    provider: "deepinfra",
    deepInfraModelId: "stabilityai/sdxl-turbo",
  },
};
