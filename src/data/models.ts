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
  // LoRA-capable SDXL models (CORRECT DeepInfra IDs)
  { label: "SDXL Base 1.0 (Universal — SDXL LoRA)", value: "stabilityai/stable-diffusion-xl-base-1.0" },
  { label: "DreamShaper XL v2 (Stylized — SDXL LoRA)", value: "Lykon/dreamshaper-xl-v2" },
  { label: "Realistic Vision XL 4.0 (Realistic — SDXL LoRA)", value: "SG161222/Realistic_Vision_4.0" },
];

// LoRA compatibility matrix
export const LORA_SUPPORTED: Record<string, boolean> = {
  "flux-schnell": false,
  "flux-dev": false,
  "seedream-xl": false,
  "janu-sdxl": false,
  "stabilityai/stable-diffusion-xl-base-1.0": true,
  "Lykon/dreamshaper-xl-v2": true,
  "SG161222/Realistic_Vision_4.0": true,
};

// Model metadata for API routing (only for models that need special handling)
export interface ModelMetadata {
  value: string;
  provider: "runware" | "deepinfra";
  apiModelId?: string; // Runware AIR ID
  deepInfraModelId?: string; // DeepInfra model ID (if different from value)
}

export const MODEL_METADATA: Record<string, ModelMetadata> = {
  "flux-schnell": {
    value: "flux-schnell",
    provider: "runware",
    apiModelId: "runware:101@1",
    deepInfraModelId: "black-forest-labs/FLUX.1-schnell",
  },
  "flux-dev": {
    value: "flux-dev",
    provider: "deepinfra",
    deepInfraModelId: "black-forest-labs/FLUX.1-dev",
  },
  "seedream-xl": {
    value: "seedream-xl",
    provider: "deepinfra",
    deepInfraModelId: "seedream/seedream-xl",
  },
  "janu-sdxl": {
    value: "janu-sdxl",
    provider: "deepinfra",
    deepInfraModelId: "janu/janu-pro-sdxl-turbo",
  },
  // LoRA-supported models use their value directly as DeepInfra model ID
  "stabilityai/stable-diffusion-xl-base-1.0": {
    value: "stabilityai/stable-diffusion-xl-base-1.0",
    provider: "deepinfra",
    deepInfraModelId: "stabilityai/stable-diffusion-xl-base-1.0",
  },
  "Lykon/dreamshaper-xl-v2": {
    value: "Lykon/dreamshaper-xl-v2",
    provider: "deepinfra",
    deepInfraModelId: "Lykon/dreamshaper-xl-v2",
  },
  "SG161222/Realistic_Vision_4.0": {
    value: "SG161222/Realistic_Vision_4.0",
    provider: "deepinfra",
    deepInfraModelId: "SG161222/Realistic_Vision_4.0",
  },
};
