import { GoogleGenAI } from '@google/genai';
import { DailyTheme } from '../types';
import { GEMINI_API_KEY } from '../config';


const SEED_CATEGORIES = [
  'Futuristic & Cyberpunk',
  'Organic Nature & Botanical',
  'Warm Cozy Cabin & Hygge',
  'Zen Minimalist & Clean Space',
  'Industrial Brutalist & Neon',
  'Retro Synthwave & 80s Sunset',
  'High Fantasy & Mystic Ruins',
  'Steampunk & Brass Clockwork',
  'Ocean Deep & Aquatic Serene',
  'Warm Desert Oasis & Adobe Clay',
  'Midnight Stars & Celestial Cosmic',
  'Art Deco & Gold Elegance'
];

export async function generateDailyTheme(): Promise<DailyTheme> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not defined in environment variables.');
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  const randomCategory = SEED_CATEGORIES[Math.floor(Math.random() * SEED_CATEGORIES.length)];

  const prompt = `Generate a highly detailed, unique, and cohesive daily aesthetic theme for digital products, inspired by the category: "${randomCategory}". 
The theme must be creative and feel premium. Return the response matching the specified JSON schema. Ensure the color palette contains a primary brand color, a secondary support color, a high-contrast accent color, a clean background color (light or dark), and a high-contrast text color.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            name: { 
              type: 'STRING', 
              description: 'A premium, creative name of the theme (e.g., "Neon Glitch Forest", "Muted Sage Minimalist", "Cozy Coffee Pixel")' 
            },
            description: { 
              type: 'STRING', 
              description: 'A brief, evocative sentence summarizing the mood and spirit of this theme.' 
            },
            aesthetic: { 
              type: 'STRING', 
              description: 'Detailed description of the visual styles, shapes, textures, lighting, and general design direction.' 
            },
            keywords: {
              type: 'ARRAY',
              items: { type: 'STRING' },
              description: 'A list of 6-8 descriptive keywords useful for graphic design prompts.'
            },
            colors: {
              type: 'OBJECT',
              properties: {
                primary: { type: 'STRING', description: 'Hex code for the primary brand color (e.g. #0284c7)' },
                secondary: { type: 'STRING', description: 'Hex code for the secondary brand color (e.g. #0d9488)' },
                accent: { type: 'STRING', description: 'Hex code for the vibrant highlight/accent color (e.g. #f59e0b)' },
                background: { type: 'STRING', description: 'Hex code for the canvas background color (light/dark, e.g. #fafafa)' },
                text: { type: 'STRING', description: 'Hex code for the body text, highly readable against background (e.g. #0f172a)' }
              },
              required: ['primary', 'secondary', 'accent', 'background', 'text']
            }
          },
          required: ['name', 'description', 'aesthetic', 'keywords', 'colors']
        }
      }
    });

    if (!response.text) {
      throw new Error('Gemini API returned an empty text response.');
    }

    const theme = JSON.parse(response.text) as DailyTheme;
    console.log(`Generated Daily Theme: "${theme.name}" (${randomCategory})`);
    return theme;
  } catch (error) {
    console.error('Failed to generate daily theme:', error);
    // Fallback theme in case of API failure
    return {
      name: 'Retro Future Minimalist',
      description: 'A sleek blend of vintage retro color palettes with sharp, modern layout interfaces.',
      aesthetic: 'Deep indigo canvas with neon teal highlights, flat vectors, clean borders, and outfit font style.',
      keywords: ['retro', 'minimalist', 'neon', 'teal', 'vintage', 'modern', 'clean'],
      colors: {
        primary: '#0f172a',
        secondary: '#0d9488',
        accent: '#f59e0b',
        background: '#ffffff',
        text: '#1e293b'
      }
    };
  }
}
