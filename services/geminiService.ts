
import { GoogleGenAI } from "@google/genai";
import { ImageData, GenerationConfig } from '../types';

export async function generateGatheringImageVariation(
  image: ImageData,
  prompt: string,
  styleHint: string,
  config: GenerationConfig,
  retryCount = 0
): Promise<string> {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === 'undefined' || apiKey === '') {
    throw new Error("API_KEY_NOT_CONFIGURED");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const apiConfig: any = {
    imageConfig: {
      aspectRatio: config.aspectRatio,
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ]
  };

  if (config.model === 'gemini-3-pro-image-preview') {
    apiConfig.imageConfig.imageSize = config.resolution;
  }

  const systemPrompt = `
    Transform this video call/conference grid into a high-quality group photograph.
    SCENE SETTING: ${prompt}
    ARTISTIC STYLE: ${styleHint}
    
    CRITICAL:
    - Identify every person in the source grid.
    - Blend them naturally into the ${prompt}.
    - Ensure faces are sharp and recognizable.
  `;

  try {
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

    if (!response.candidates?.[0]) {
       throw new Error('No candidates returned. Safety filters might be blocking this input.');
    }
    
    const parts = response.candidates[0].content?.parts;
    if (!parts) throw new Error('Response parts are missing.');

    for (const part of parts) {
      if (part.inlineData?.data) {
        return part.inlineData.data;
      }
    }
    
    throw new Error('No image data found in model response.');
  } catch (err: any) {
    const errString = typeof err === 'string' ? err : JSON.stringify(err);
    
    // 429: Rate Limit, Resource Exhausted, or Quota=0
    if (errString.includes('429') || errString.includes('RESOURCE_EXHAUSTED') || errString.includes('limit":0')) {
       // Limit 0 is a permanent state until Billing is linked
       if (errString.includes('limit":0')) {
         const quotaErr = new Error("BILLING_REQUIRED");
         // @ts-ignore
         quotaErr.raw = errString;
         throw quotaErr;
       }

       // Exponential backoff for transient rate limits
       if (retryCount < 2) {
          const waitTime = Math.pow(2, retryCount) * 2000;
          await new Promise(resolve => setTimeout(resolve, waitTime));
          return generateGatheringImageVariation(image, prompt, styleHint, config, retryCount + 1);
       }
    }
    
    throw err;
  }
}
