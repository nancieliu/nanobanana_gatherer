
import { GoogleGenAI } from "@google/genai";
import { ImageData, GenerationConfig } from '../types';

/**
 * Verifies if the image has usable faces
 */
export async function verifyImageContent(image: ImageData): Promise<boolean> {
  // Use type assertion to satisfy TS during build
  const apiKey = (process.env as any).API_KEY;
  if (!apiKey) return true; 

  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: image.base64, mimeType: image.mimeType } },
          { text: "Does this image contain clear faces of people that can be used for a group photo? Respond with ONLY 'YES' or 'NO'." }
        ]
      }
    });
    return response.text?.trim().toUpperCase().includes('YES') || false;
  } catch (e) {
    return true; 
  }
}

export async function generateGatheringImageVariation(
  image: ImageData,
  prompt: string,
  styleHint: string,
  config: GenerationConfig
): Promise<string> {
  const apiKey = (process.env as any).API_KEY;
  if (!apiKey) throw new Error("API Key is missing. Please check your settings.");

  const ai = new GoogleGenAI({ apiKey });
  
  const apiConfig: any = {
    imageConfig: {
      aspectRatio: config.aspectRatio,
    },
  };

  if (config.model === 'gemini-3-pro-image-preview') {
    apiConfig.imageConfig.imageSize = config.resolution;
  }

  const systemPrompt = `
    You are a master of digital photography and human connection.
    TASK: Transform this video call screenshot into a beautiful group memory.
    SETTING: ${prompt}
    STYLE: ${styleHint}
    
    CRITICAL RULES:
    1. EXTRACT PEOPLE: Identify every person with a clear face in the screenshot.
    2. COMPOSITION: Place them together naturally as if they are in the same room. 
    3. NO HEIGHTS: Position them seated or in a close-knit group shot (bust-up) so individual heights are not obvious.
    4. HAPPINESS: Make sure everyone has a warm, happy expression.
    5. QUALITY: Integrate lighting and shadows from the new background perfectly onto their faces.
    6. FILTER: Ignore/remove any boxes that don't have clear faces or are just slides/backgrounds.
  `;

  const response = await ai.models.generateContent({
    model: config.model,
    contents: {
      parts: [
        { inlineData: { data: image.base64, mimeType: image.mimeType } },
        { text: systemPrompt }
      ]
    },
    config: apiConfig,
  });

  const candidates = response.candidates;
  if (!candidates || candidates.length === 0) throw new Error('Generation failed: No candidates');
  
  const parts = candidates[0].content?.parts;
  if (!parts) throw new Error('Generation failed: No content in response');

  for (const part of parts) {
    if (part.inlineData?.data) {
      return part.inlineData.data;
    }
  }
  
  throw new Error('No image returned from model');
}
