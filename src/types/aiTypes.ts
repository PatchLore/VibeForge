export type AIProvider = "deepinfra" | "hf";

export interface DeepInfraModel {
  id: string;
  name: string;
  maxResolution: string;
}

export interface GeneratedImage {
  imageBase64: string;
  model: string;
}

