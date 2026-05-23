import { GoogleGenAI } from '@google/genai';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { DailyTheme } from '../types';
import { GEMINI_API_KEY } from '../config';
import { ensureContrast } from '../utils';

interface TextPrompt {
  title: string;
  role: string;
  promptText: string;
  instructions: string;
}

interface ImagePrompt {
  title: string;
  promptText: string;
  parameters: string;
  tips: string;
}

interface PromptsData {
  title: string;
  introduction: string;
  textPrompts: TextPrompt[];
  imagePrompts: ImagePrompt[];
}

export async function generatePrompts(theme: DailyTheme, outputDir: string): Promise<string> {
  console.log(`Generating structured prompt pack for theme: "${theme.name}"...`);
  
  let data: PromptsData;

  const fallbackData: PromptsData = {
    title: `${theme.name} AI Prompt Recipes`,
    introduction: `This guide provides optimized prompt recipes for text and image models matching the ${theme.name} aesthetic. Use these prompts to streamline content generation and visual asset creation.`,
    textPrompts: [
      {
        title: 'Marketing Content Creator',
        role: 'Creative Copywriter',
        promptText: 'Act as a professional copywriter. Write a 300-word marketing campaign description for [Product Name] using the visual tone and key terms from the aesthetic: [Aesthetic Description]. Enforce high-converting structures and an engaging call-to-action.',
        instructions: 'Replace [Product Name] with your brand name, and insert the daily theme description into [Aesthetic Description] for tailored copy.'
      },
      {
        title: 'System Architecture Architect',
        role: 'Senior Software Engineer',
        promptText: 'Design a scalable file storage pipeline in TypeScript for [Niche/Category]. The solution should use cloud storage buckets, support ZIP bundling, and run on a daily cron schedule. Provide clean, modular code with documentation.',
        instructions: 'Fill in [Niche/Category] with your specific industry topic (e.g. Graphic Design Assets or Personal Finance logs).'
      },
      {
        title: 'Daily Task Optimizer',
        role: 'Personal Productivity Coach',
        promptText: 'Analyze my top 3 daily goals: [Goal 1], [Goal 2], [Goal 3]. Outline a step-by-step hourly schedule to execute them efficiently, incorporating short breaks and reflections.',
        instructions: 'List your actual high-priority focus tasks to generate a customized, actionable daily routine schedule.'
      }
    ],
    imagePrompts: [
      {
        title: 'Sleek Aesthetic Wallpaper',
        promptText: `A premium, ultra-high-resolution desktop wallpaper, theme: "${theme.name}". Visual style: clean digital art, modern composition, cinematic lighting, masterpiece, high details. Color scheme: ${theme.colors.primary}, ${theme.colors.secondary}, with ${theme.colors.accent} highlights.`,
        parameters: '--ar 16:9 --style raw --v 6.0',
        tips: 'Adjust the theme colors to shift the primary tones, or add specific visual subjects like "geometric wireframes" to the prompt.'
      },
      {
        title: 'Modern UI Mockup Design',
        promptText: `A sleek mobile app user interface dashboard design. Clean minimal layout, glassmorphic card containers, vivid colors matching ${theme.colors.secondary} and ${theme.colors.accent} on a deep background.`,
        parameters: '--ar 9:16 --v 6.0',
        tips: 'Replace "mobile app" with "desktop web app" to change the layout device frame constraints.'
      }
    ]
  };

  if (!GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY is not defined. Using mock data for prompts guide.');
    data = fallbackData;
  } else {
    try {
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      const prompt = `You are a Professional Prompt Engineer and AI Consultant. Generate a highly valuable, professional AI Prompt Guide & Recipe Pack matching the theme: "${theme.name}" (described as: ${theme.description}).
The theme's aesthetic is described as: ${theme.aesthetic}.

Generate the content and return a JSON response matching the schema. Write complete, detailed, and copy-pasteable prompts with bracketed placeholders (e.g., [Insert Topic]) that help creators and professionals get elite, production-quality results. Do not write generic short prompts.

The pack must contain:
1. A publication-ready title.
2. A professional introduction explaining the value of these prompts.
3. Exactly 3 comprehensive text prompts (for ChatGPT, Claude, Gemini) covering system context, structured guidelines, and output formatting.
4. Exactly 2 comprehensive image prompts (for Midjourney, DALL-E, Stable Diffusion, Flux) centered on the visual aesthetic. Include camera settings, styles, and lighting details.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              title: { type: 'STRING', description: 'Title of the prompt guide' },
              introduction: { type: 'STRING', description: 'Brief introduction to the guide' },
              textPrompts: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    title: { type: 'STRING', description: 'Descriptive title of the prompt (e.g. Content Strategy Planner)' },
                    role: { type: 'STRING', description: 'System role or persona for the AI' },
                    promptText: { type: 'STRING', description: 'The exact copy-pasteable prompt template (use [Bracketed Placeholders] for user inputs)' },
                    instructions: { type: 'STRING', description: 'How to use, what to expect, and customized tips' }
                  },
                  required: ['title', 'role', 'promptText', 'instructions']
                },
                description: 'Exactly 3 text model prompts'
              },
              imagePrompts: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    title: { type: 'STRING', description: 'Descriptive title (e.g. Minimalist Branding Mockup)' },
                    promptText: { type: 'STRING', description: 'The exact image prompt' },
                    parameters: { type: 'STRING', description: 'Model parameters like aspect ratio or quality flags (e.g. --ar 16:9 --v 6.0)' },
                    tips: { type: 'STRING', description: 'Tips on modifying subject, style, or color inputs' }
                  },
                  required: ['title', 'promptText', 'parameters', 'tips']
                },
                description: 'Exactly 2 image model prompts'
              }
            },
            required: ['title', 'introduction', 'textPrompts', 'imagePrompts']
          }
        }
      });

      if (!response.text) {
        throw new Error('Gemini API returned an empty response for the prompts guide.');
      }

      data = JSON.parse(response.text) as PromptsData;
    } catch (err) {
      console.warn('Failed to generate prompts guide with Gemini API. Falling back to high-quality default data.', err);
      data = fallbackData;
    }
  }

  // Compute contrast-safe colors
  const primaryColor = ensureContrast(theme.colors.primary, '#ffffff', 4.5);
  const secondaryColor = ensureContrast(theme.colors.secondary, '#ffffff', 4.5);
  const accentColor = ensureContrast(theme.colors.accent, '#ffffff', 4.5);

  // Generate HTML for Text Prompts
  const textPromptsHtml = data.textPrompts.map((tp, idx) => `
    <div class="prompt-card">
      <div class="prompt-header">
        <span class="prompt-badge" style="background-color: ${primaryColor};">TEXT PROMPT 0${idx + 1}</span>
        <h3 class="prompt-title" style="color: ${primaryColor};">${tp.title}</h3>
      </div>
      <div class="prompt-meta">
        <strong>Persona/Role:</strong> <code>${tp.role}</code>
      </div>
      <div class="code-container">
        <div class="copy-bar" style="border-bottom: 1px solid ${primaryColor}15; color: ${secondaryColor};">
          <span>📋 COPY TEMPLATE</span>
          <span>TEXT RECIPE</span>
        </div>
        <pre><code>${tp.promptText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
      </div>
      <p class="prompt-instructions"><strong>Instructions:</strong> ${tp.instructions}</p>
    </div>
  `).join('');

  // Generate HTML for Image Prompts
  const imagePromptsHtml = data.imagePrompts.map((ip, idx) => `
    <div class="prompt-card">
      <div class="prompt-header">
        <span class="prompt-badge" style="background-color: ${accentColor};">IMAGE PROMPT 0${idx + 1}</span>
        <h3 class="prompt-title" style="color: ${primaryColor};">${ip.title}</h3>
      </div>
      <div class="code-container">
        <div class="copy-bar" style="border-bottom: 1px solid ${accentColor}15; color: ${secondaryColor};">
          <span>🎨 VISUAL PROMPT</span>
          <span>${ip.parameters}</span>
        </div>
        <pre><code class="image-code">${ip.promptText.replace(/</g, '&lt;').replace(/>/g, '&gt;')} ${ip.parameters}</code></pre>
      </div>
      <p class="prompt-instructions"><strong>Customization Tips:</strong> ${ip.tips}</p>
    </div>
  `).join('');

  const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${data.title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Outfit:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;1,400&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Outfit', sans-serif;
      background-color: #ffffff;
      color: #1e293b;
      margin: 0;
      padding: 0;
      line-height: 1.6;
      -webkit-print-color-adjust: exact;
    }
    
    .guide-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 60px 50px;
      box-sizing: border-box;
      min-height: 297mm; /* Standard A4 height */
      background-color: #ffffff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    header {
      border-bottom: 2px solid ${primaryColor};
      padding-bottom: 15px;
      margin-bottom: 35px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    
    .meta-theme {
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: ${secondaryColor};
      font-weight: 700;
    }
    
    .meta-date {
      font-size: 0.85rem;
      color: #64748b;
      font-weight: 500;
    }
    
    h1 {
      font-family: 'Playfair Display', serif;
      font-size: 2.5rem;
      color: #0f172a;
      margin-top: 0;
      margin-bottom: 20px;
      font-weight: 700;
      line-height: 1.25;
    }

    .subtitle {
      font-size: 1.1rem;
      color: #64748b;
      margin-top: -15px;
      margin-bottom: 30px;
      font-weight: 400;
    }
    
    h2 {
      font-family: 'Playfair Display', serif;
      font-size: 1.6rem;
      color: ${primaryColor};
      margin-top: 40px;
      margin-bottom: 20px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 8px;
      page-break-after: avoid;
    }

    .intro-text {
      font-size: 1.05rem;
      color: #334155;
      margin-bottom: 35px;
    }
    
    .prompt-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 25px;
      margin-bottom: 30px;
      page-break-inside: avoid;
    }
    
    .prompt-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 15px;
    }
    
    .prompt-badge {
      color: #ffffff;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 4px;
      letter-spacing: 0.5px;
    }
    
    .prompt-title {
      font-family: 'Playfair Display', serif;
      font-size: 1.3rem;
      margin: 0;
      font-weight: 700;
    }
    
    .prompt-meta {
      font-size: 0.9rem;
      color: #475569;
      margin-bottom: 15px;
    }

    .prompt-meta code {
      font-family: 'Fira Code', monospace;
      background-color: #f1f5f9;
      padding: 2px 6px;
      border-radius: 4px;
      color: #0f172a;
    }
    
    .code-container {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      background-color: #fafafa;
      margin-bottom: 15px;
      overflow: hidden;
    }

    .copy-bar {
      display: flex;
      justify-content: space-between;
      padding: 8px 15px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.5px;
      background-color: #f8fafc;
    }

    pre {
      margin: 0;
      padding: 15px;
      overflow-x: auto;
    }
    
    code {
      font-family: 'Fira Code', monospace;
      font-size: 0.9rem;
      color: #0f172a;
      white-space: pre-wrap;
      word-break: break-all;
    }

    .image-code {
      color: #047857; /* Styled image prompt text */
    }
    
    .prompt-instructions {
      font-size: 0.95rem;
      margin: 0;
      color: #334155;
    }

    .aesthetic-callout {
      background-color: ${primaryColor}05;
      border: 1px solid ${primaryColor}15;
      padding: 20px;
      border-radius: 8px;
      margin-top: 30px;
      font-size: 0.95rem;
      color: #475569;
      page-break-inside: avoid;
    }
    
    footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 15px;
      margin-top: 40px;
      text-align: center;
      font-size: 0.8rem;
      color: #94a3b8;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="guide-container">
    <div>
      <header>
        <div class="meta-theme">PROMPTS • THEME: ${theme.name}</div>
        <div class="meta-date">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
      </header>
      
      <h1>${data.title}</h1>
      <div class="subtitle">Daily Premium Prompts Pack: High-Yield AI Prompts Center in the ${theme.name} Aesthetic</div>
      
      <div class="intro-text">${data.introduction}</div>
      
      <h2>Text Generation Prompts</h2>
      <div class="prompts-group">
        ${textPromptsHtml}
      </div>
      
      <div style="page-break-before: always;"></div>
      
      <h2>Visual Generation Prompts</h2>
      <div class="prompts-group">
        ${imagePromptsHtml}
      </div>

      <div class="aesthetic-callout">
        <strong>Aesthetic Implementation:</strong> These visual prompts are carefully calibrated to trigger the unique visual identity of <strong>${theme.name}</strong>, yielding compositions rich in ${theme.aesthetic.toLowerCase()}
      </div>
    </div>
    
    <footer>
      🤖 Coordinated Daily Suite • Powered by Gemini 2.5 Flash • Uncompromising Digital Asset Design
    </footer>
  </div>
</body>
</html>
  `;

  const outputPath = path.join(outputDir, 'prompt-guide.pdf');

  // Compile to PDF using Puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: 'load' });
    
    try {
      await page.evaluate(() => document.fonts.ready);
    } catch (err) {
      console.warn('Failed to wait for fonts to load in prompts compiler:', err);
    }

    // Output A4 PDF
    await page.pdf({
      path: outputPath,
      format: 'A4',
      margin: {
        top: '0px',
        bottom: '0px',
        left: '0px',
        right: '0px'
      },
      printBackground: true
    });

    console.log(`Prompt guide PDF compiled and saved to: ${outputPath}`);
    return outputPath;
  } finally {
    await browser.close();
  }
}
