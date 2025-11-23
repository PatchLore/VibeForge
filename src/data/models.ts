export interface ImageModel {
  id: string; // Frontend value (e.g., "flux-schnell")
  name: string; // Display label
  provider: "runware" | "deepinfra";
  supportsLora: boolean;
  isSDXLCompatible: boolean; // For LoRA routing logic
  apiModelId?: string; // Actual API model ID (for Runware)
  deepInfraModelId?: string; // Actual DeepInfra model ID
}

export const MODELS: ImageModel[] = [
  {
    id: "flux-schnell",
    name: "FLUX.1 Schnell (Fast — Runware)",
    provider: "runware",
    supportsLora: false, // Flux models don't support LoRAs
    isSDXLCompatible: false,
    apiModelId: "runware:101@1", // Runware AIR ID
    deepInfraModelId: "black-forest-labs/FLUX.1-schnell", // Fallback DeepInfra model
  },
  {
    id: "flux-dev",
    name: "FLUX.1 Dev (HQ — DeepInfra)",
    provider: "deepinfra",
    supportsLora: false, // Flux models don't support LoRAs
    isSDXLCompatible: false,
    deepInfraModelId: "black-forest-labs/FLUX.1-dev",
  },
  {
    id: "seedream-xl",
    name: "Seedream XL (Artistic — DeepInfra)",
    provider: "deepinfra",
    supportsLora: true, // SDXL-compatible
    isSDXLCompatible: true,
    deepInfraModelId: "seedream/seedream-xl", // TODO: Verify actual DeepInfra model ID
  },
  {
    id: "janu-sdxl",
    name: "Janu Pro SDXL Turbo (Realistic — DeepInfra)",
    provider: "deepinfra",
    supportsLora: true, // SDXL-compatible
    isSDXLCompatible: true,
    deepInfraModelId: "janu/janu-pro-sdxl-turbo", // TODO: Verify actual DeepInfra model ID
  },
  {
    id: "sdxl-base",
    name: "SDXL 1.0 Base (Legacy)",
    provider: "deepinfra",
    supportsLora: true, // SDXL-compatible
    isSDXLCompatible: true,
    deepInfraModelId: "stabilityai/stable-diffusion-xl-base-1.0",
  },
];
