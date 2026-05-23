import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { DailyTheme } from '../types';
import { FAL_KEY, GEMINI_API_KEY } from '../config';

export async function generateWallpaper(theme: DailyTheme, outputDir: string): Promise<string> {
  const outputPath = path.join(outputDir, 'wallpaper.png');

  if (!FAL_KEY) {
    console.warn('FAL_KEY is not defined in environment variables. Using fallback Unsplash wallpaper.');
    try {
      const placeholderUrl = `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1920&auto=format&fit=crop`;
      const writer = fs.createWriteStream(outputPath);
      const downloadResponse = await axios({
        url: placeholderUrl,
        method: 'GET',
        responseType: 'stream'
      });
      downloadResponse.data.pipe(writer);
      await new Promise<void>((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
      console.log(`Fallback wallpaper saved to: ${outputPath}`);
      return outputPath;
    } catch (fallbackError) {
      console.error('Failed fallback Unsplash download:', fallbackError);
      throw fallbackError;
    }
  }

  let prompt = `A premium, ultra-high-resolution desktop wallpaper, theme: "${theme.name}". 
Aesthetic details: ${theme.aesthetic}. 
Visual style: clean digital art, modern composition, cinematic lighting, masterpiece, high details. 
No text, no watermarks, no signatures. Aspect ratio 16:9. Color scheme: ${theme.colors.primary}, ${theme.colors.secondary}, with ${theme.colors.accent} highlights.`;

  if (GEMINI_API_KEY) {
    try {
      console.log('Expanding wallpaper prompt using Gemini 2.5 Flash...');
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      const expansionResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are an expert prompt designer for state-of-the-art text-to-image models like FLUX.1. Expand the daily theme into a highly descriptive, visually rich prompt for generating a premium desktop wallpaper.
Theme: ${theme.name}
Description: ${theme.description}
Aesthetic: ${theme.aesthetic}
Keywords: ${theme.keywords.join(', ')}
Target Colors: Primary (${theme.colors.primary}), Secondary (${theme.colors.secondary}), Accent (${theme.colors.accent}).

Write a single paragraph (100-150 words) describing a stunning, professional-grade desktop wallpaper.
Include details about:
1. Subject & Scene: visual elements, composition, depth of field, perspective.
2. Materials & Textures: e.g. polished chrome, brushed metals, frosted glass, organic elements, digital particles.
3. Lighting & Atmosphere: e.g. volumetric neon glows, raytraced reflections, cinematic lighting, dramatic shadows.
4. Render Quality: e.g. 8k, Octane Render style, Unreal Engine 5 aesthetic, clean 3D art, sleek vector shapes.
5. Explicitly enforce the target color palette.
Do not include introductory text, just return the raw prompt. Explicitly state at the end "no text, no watermarks, no signatures, aspect ratio 16:9".`
      });

      if (expansionResponse.text) {
        prompt = expansionResponse.text.trim();
        console.log(`Expanded prompt successfully: "${prompt}"`);
      }
    } catch (err) {
      console.warn('Failed to expand wallpaper prompt, using fallback base prompt:', err);
    }
  }

  console.log(`Generating wallpaper for theme: "${theme.name}" via Fal.ai...`);

  try {
    const response = await axios.post(
      'https://fal.run/fal-ai/flux/schnell',
      {
        prompt,
        image_size: {
          width: 1920,
          height: 1080
        },
        num_inference_steps: 4,
        enable_safety_checker: true,
        sync_mode: true
      },
      {
        headers: {
          'Authorization': `Key ${FAL_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60s timeout for image generation
      }
    );

    const imageUrl = response.data?.images?.[0]?.url;
    if (!imageUrl) {
      throw new Error('No image URL returned from Fal.ai API.');
    }


    console.log(`Downloading wallpaper from Fal.ai: ${imageUrl}`);
    
    // Download image and save it
    const writer = fs.createWriteStream(outputPath);
    const downloadResponse = await axios({
      url: imageUrl,
      method: 'GET',
      responseType: 'stream'
    });

    downloadResponse.data.pipe(writer);

    await new Promise<void>((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    console.log(`Wallpaper saved to: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error('Failed to generate wallpaper:', error);
    
    // Create a fallback colored image in case of API failure (so the pipeline never crashes)

    console.log('Creating a fallback background file...');
    
    // We can write a simple SVG or text/png if we had canvas, or we can just download a public placeholder
    // Let's download a beautiful Unsplash placeholder styled with the theme primary color
    try {
      const hexWithoutHash = theme.colors.primary.replace('#', '');
      const placeholderUrl = `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1920&auto=format&fit=crop`;
      
      const writer = fs.createWriteStream(outputPath);
      const downloadResponse = await axios({
        url: placeholderUrl,
        method: 'GET',
        responseType: 'stream'
      });
      downloadResponse.data.pipe(writer);
      await new Promise<void>((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
      console.log(`Fallback wallpaper saved to: ${outputPath}`);
      return outputPath;
    } catch (fallbackError) {
      console.error('Failed both Fal.ai and fallback Unsplash download:', fallbackError);
      throw fallbackError;
    }
  }
}
