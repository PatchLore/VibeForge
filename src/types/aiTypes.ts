export type AIProvider = "deepinfra";

export interface DeepInfraModel {
  id: string;
  name: string;
  maxResolution: string;
}

export interface GeneratedImage {
  imageBase64: string;
  model: string;
}

