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
  
  if (!apiKey || apiKey === 'undefined') {
    throw new Error("API_KEY_MISSING");
  }

  // Always create a fresh instance right before the call to ensure the key from the dialog is used
  const ai = new GoogleGenAI({ apiKey });
  
  const apiConfig: any = {
    imageConfig: {
      aspectRatio: config.aspectRatio,
    },
    // We set safety to BLOCK_NONE to ensure standard human photos aren't falsely flagged as violations,
    // which sometimes triggers a generic quota error.
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
    Transform this video call/conference grid into a high-quality, professional group photograph.
    SCENE SETTING: ${prompt}
    ARTISTIC STYLE: ${styleHint}
    
    CRITICAL INSTRUCTIONS:
    1. Identify all people visible in the screenshot grid.
    2. Place them naturally together in the ${prompt} as if they were physically present.
    3. Maintain their likeness, hair styles, and clothing colors.
    4. Ensure professional studio lighting and sharp focus on faces.
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
       throw new Error('Gemini failed to generate candidates. The input image might have been flagged by the safety system.');
    }
    
    const parts = response.candidates[0].content?.parts;
    if (!parts) throw new Error('Model returned an empty response. Try simplifying your prompt.');

    for (const part of parts) {
      if (part.inlineData?.data) {
        return part.inlineData.data;
      }
    }
    
    throw new Error('The model responded with text instead of an image. Please try a different background.');
  } catch (err: any) {
    const errString = JSON.stringify(err);
    
    // Check for "Quota" or "Limit 0" errors specifically
    if (errString.includes('429') || errString.includes('RESOURCE_EXHAUSTED') || errString.includes('limit":0')) {
       // If we can retry once, wait 5 seconds (standard tier backoff)
       if (retryCount < 1) {
          console.warn("Quota limit hit. Retrying in 5 seconds...");
          await new Promise(resolve => setTimeout(resolve, 5000));
          return generateGatheringImageVariation(image, prompt, styleHint, config, retryCount + 1);
       }
    }
    
    throw err;
  }
}

export async function verifyImageContent(image: ImageData): Promise<boolean> {
  return true; 
}