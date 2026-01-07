
import { BackgroundOption, ToneOption, ImageResolution, AspectRatio } from './types';

export const BACKGROUND_OPTIONS: BackgroundOption[] = [
  {
    id: 'cozy-cafe',
    name: 'Morning Cafe',
    prompt: 'a sun-drenched, cozy artisan coffee shop with wooden tables and steam rising from cups',
    thumbnailUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'sunny-picnic',
    name: 'Park Picnic',
    prompt: 'a lush green city park on a sunny day, people sitting on a checkered blanket with a picnic basket',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'campus-lawn',
    name: 'School Campus',
    prompt: 'a historic university campus quad with majestic stone architecture and ancient trees in the background',
    thumbnailUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'dinner-party',
    name: 'Dinner Table',
    prompt: 'an elegant, warmly lit dining room with a long table set for a feast and candles glowing',
    thumbnailUrl: 'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'campfire',
    name: 'Evening Campfire',
    prompt: 'a magical evening at a mountain campsite, sitting around a glowing orange campfire under a starry sky',
    thumbnailUrl: 'https://images.unsplash.com/photo-1487730116645-74489c95b41b?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'modern-loft',
    name: 'Modern Loft',
    prompt: 'a stylish industrial loft with large windows, brick walls, and comfortable lounge seating',
    thumbnailUrl: 'https://images.unsplash.com/photo-1560448204-61dc36dc98c8?auto=format&fit=crop&w=200&q=80',
  },
];

export const TONE_OPTIONS: ToneOption[] = [
  { id: 'natural', name: 'Natural', prompt: 'candid, authentic, and warm lifestyle photography' },
  { id: 'formal', name: 'Formal', prompt: 'strictly professional corporate setting, polished suits, sophisticated and serious corporate portrait style' },
  { id: 'naughty', name: 'Naughty', prompt: 'mischievous energy, cheeky expressions, playful chaos, fun and slightly rebellious party atmosphere' },
  { id: 'cinematic', name: 'Cinematic', prompt: 'moody dramatic lighting, shallow depth of field, high-end film look' },
  { id: 'retro', name: 'Retro', prompt: 'vintage 90s polaroid aesthetic, grainy texture, warm nostalgic tones' },
];

export const STYLE_VARIATIONS = [
  "Candid and warm, lifestyle photography",
  "Professional cinematic lighting, crisp focus",
  "Soft vintage polaroid feel, nostalgic"
];

export const RESOLUTIONS: ImageResolution[] = ['1K', '2K', '4K'];
export const ASPECT_RATIOS: AspectRatio[] = ['1:1', '4:3', '16:9', '9:16', '3:4'];
