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
  // LoRA-supported SDXL models
  { label: "SDXL 1.0 Base (Universal — DeepInfra)", value: "sdxl-base" },
  { label: "DreamShaper XL (Stylized — DeepInfra)", value: "dreamshaper-xl" },
  { label: "Realistic Vision XL (Realistic — DeepInfra)", value: "realvis-xl" },
];

// LoRA compatibility matrix
export const LORA_SUPPORTED: Record<string, boolean> = {
  "flux-schnell": false,
  "flux-dev": false,
  "seedream-xl": false,
  "janu-sdxl": false,
  "sdxl-base": true,
  "dreamshaper-xl": true,
  "realvis-xl": true,
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
  "dreamshaper-xl": {
    value: "dreamshaper-xl",
    provider: "deepinfra",
    deepInfraModelId: "lykon/dreamshaper-xl", // TODO: Verify actual DeepInfra model ID
  },
  "realvis-xl": {
    value: "realvis-xl",
    provider: "deepinfra",
    deepInfraModelId: "SG161222/RealVisXL_V4.0", // TODO: Verify actual DeepInfra model ID
  },
};
