
export interface BackgroundOption {
  id: string;
  name: string;
  prompt: string;
  thumbnailUrl: string;
}

export interface ToneOption {
  id: string;
  name: string;
  prompt: string;
}

export interface ImageData {
  base64: string;
  mimeType: string;
}

export type ImageResolution = '1K' | '2K' | '4K';
export type AspectRatio = '1:1' | '4:3' | '16:9' | '9:16' | '3:4';
export type ImageModel = 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview';

export interface GenerationConfig {
  model: ImageModel;
  resolution: ImageResolution;
  aspectRatio: AspectRatio;
  tone: string;
}
