// Simple model definition for dropdown
export interface ModelOption {
  label: string;
  value: string;
}

export const MODELS: ModelOption[] = [
  { label: "FLUX.1 Schnell (Fast — Runware)", value: "flux-schnell" },
  { label: "FLUX.1 Dev (HQ — DeepInfra)", value: "flux-dev" },
  { label: "Seedream XL (Artistic — DeepInfra)", value: "seedream-xl" },
  { label: "Janu Pro SDXL Turbo (Realistic — DeepInfra)", value: "janu-sdxl" },
  { label: "SDXL 1.0 Base (Universal — DeepInfra)", value: "sdxl-base" },
];

// LoRA compatibility matrix
export const LORA_SUPPORTED: Record<string, boolean> = {
  "seedream-xl": false,
  "flux-schnell": false,
  "flux-dev": false,
  "janu-sdxl": true,
  "sdxl-base": true,
};

// Model metadata for API routing
export interface ModelMetadata {
  value: string;
  provider: "runware" | "deepinfra";
  apiModelId?: string; // Runware AIR ID
  deepInfraModelId?: string; // DeepInfra model ID
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
    deepInfraModelId: "seedream/seedream-xl", // TODO: Verify actual DeepInfra model ID
  },
  "janu-sdxl": {
    value: "janu-sdxl",
    provider: "deepinfra",
    deepInfraModelId: "janu/janu-pro-sdxl-turbo", // TODO: Verify actual DeepInfra model ID
  },
  "sdxl-base": {
    value: "sdxl-base",
    provider: "deepinfra",
    deepInfraModelId: "stabilityai/stable-diffusion-xl-base-1.0",
  },
};
