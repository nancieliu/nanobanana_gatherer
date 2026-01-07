
import { BackgroundOption, ToneOption, ImageResolution, AspectRatio } from './types';

export const BACKGROUND_OPTIONS: BackgroundOption[] = [
  {
    id: 'corporate-hq',
    name: 'Corporate HQ',
    prompt: 'a high-end, sleek Silicon Valley tech headquarters with glass partitions, architectural lighting, lush indoor greenery, and a sophisticated minimalist aesthetic',
    thumbnailUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'boardroom',
    name: 'Executive Boardroom',
    prompt: 'a premium executive boardroom with a polished mahogany table, designer leather seating, and a breathtaking panoramic city skyline visible through floor-to-ceiling windows',
    thumbnailUrl: 'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'networking-event',
    name: 'Industry Mixer',
    prompt: 'a stylish rooftop lounge at twilight, sophisticated mood lighting, modern cocktail furniture, and a high-end professional networking atmosphere',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'cozy-cafe',
    name: 'Creative Cafe',
    prompt: 'a sun-drenched, modern artisan coffee shop with industrial-chic decor, wooden tables, and a creative working environment',
    thumbnailUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'dinner-party',
    name: 'Gala Dinner',
    prompt: 'an opulent grand dining hall with white tablecloths, crystal glassware, and warm ambient candlelight for a formal celebration',
    thumbnailUrl: 'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'modern-loft',
    name: 'Studio Loft',
    prompt: 'a bright industrial studio loft with exposed brick, large factory windows, and contemporary lounge furniture',
    thumbnailUrl: 'https://images.unsplash.com/photo-1560448204-61dc36dc98c8?auto=format&fit=crop&w=200&q=80',
  },
];

export const TONE_OPTIONS: ToneOption[] = [
  { 
    id: 'natural', 
    name: 'Natural', 
    prompt: 'authentic candid photography, warm natural sunlight, soft focus, and a relaxed lifestyle feel' 
  },
  { 
    id: 'formal', 
    name: 'Formal', 
    prompt: 'editorial business photography, sharp focus, professional three-point lighting, sophisticated posture, and corporate prestige' 
  },
  { 
    id: 'naughty', 
    name: 'Naughty', 
    prompt: 'cheeky and mischievous energy, people making funny faces, lighthearted playful pranks, high-energy party vibe with a sense of rebellious fun' 
  },
  { 
    id: 'cinematic', 
    name: 'Cinematic', 
    prompt: 'high-budget film aesthetic, dramatic teal and orange color grading, shallow depth of field, and anamorphic lens flares' 
  },
  { 
    id: 'retro', 
    name: 'Retro', 
    prompt: 'authentic 90s flash photography, heavy film grain, slight motion blur, and a nostalgic analog snapshot aesthetic' 
  },
];

export const STYLE_VARIATIONS = [
  "Candid and warm, lifestyle photography",
  "Professional cinematic lighting, crisp focus",
  "Soft vintage polaroid feel, nostalgic"
];

export const RESOLUTIONS: ImageResolution[] = ['1K', '2K', '4K'];
export const ASPECT_RATIOS: AspectRatio[] = ['1:1', '4:3', '16:9', '9:16', '3:4'];
