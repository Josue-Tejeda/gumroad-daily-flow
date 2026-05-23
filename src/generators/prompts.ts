import { GoogleGenAI } from '@google/genai';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { DailyTheme } from '../types';
import { GEMINI_API_KEY } from '../config';
import { cleanHtml, ensureContrast } from '../utils';

export async function generatePrompts(theme: DailyTheme, outputDir: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not defined in environment variables.');
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  console.log(`Generating prompt pack for theme: "${theme.name}"...`);

  const prompt = `You are a Prompt Engineer expert. Generate a detailed, highly valuable AI Prompt Guide / Recipe Pack matching the theme: "${theme.name}" (described as: ${theme.description}).

Generate the content in HTML format (ONLY the body content inside a container, do not include <html>, <head>, or <body> tags). Use headings (<h2>, <h3>), paragraphs (<p>), code blocks (<pre><code>), lists (<ul>, <li>), and strong tags (<strong>).

CRITICAL INSTRUCTIONS:
- Do NOT include any inline CSS styles, style blocks, or background colors inside your HTML tags.
- Do NOT add a \`style\` attribute to any HTML element.
- Do NOT wrap your output in markdown code blocks like \`\`\`html. Just return raw HTML.
- Rely entirely on standard semantic HTML elements. The page styling and visual color theme are handled by our global stylesheet.

The guide must contain:
1. An <h1> title matching the theme (e.g. "Creative Prompts for ${theme.name}").
2. Introduction: Briefly explain how these prompts unlock creative work related to the theme.
3. 3 x Text Prompts (for ChatGPT, Claude, Gemini): Write complete, copy-pasteable prompts with placeholders (e.g. [Insert Topic]) that help users write themed content, essays, or generate ideas in this aesthetic.
4. 2 x Image Prompts (for Midjourney, DALL-E, Stable Diffusion): Write descriptive, cinematic prompts designed to create artwork in this theme's style.
5. Provide a short explanation of tips for customizing each prompt.

Wrap the actual copy-pasteable prompt text inside <pre><code> tags so it is easy to read.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt
    });

    const rawContent = response.text || '';
    if (!rawContent) {
      throw new Error('Gemini API returned empty text response for the prompt pack.');
    }

    const promptGuideContent = cleanHtml(rawContent);

    // Compute contrast-safe colors
    const primaryColor = ensureContrast(theme.colors.primary, '#ffffff', 4.5);
    const secondaryColor = ensureContrast(theme.colors.secondary, '#ffffff', 4.5);
    const accentColor = ensureContrast(theme.colors.accent, '#ffffff', 4.5);

    // HTML Page template with CSS styles using the theme's colors
    const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${theme.name} AI Prompts</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;600&family=Outfit:wght@300;400;600;800&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');
    
    body {
      font-family: 'Outfit', sans-serif;
      background-color: #ffffff;
      color: #1e293b; /* High-contrast dark slate body text */
      margin: 0;
      padding: 0;
      line-height: 1.6;
      -webkit-print-color-adjust: exact;
    }
    
    .prompt-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 60px 40px;
      box-sizing: border-box;
      min-height: 297mm; /* A4 size height */
      background-color: #ffffff;
    }
    
    header {
      border-bottom: 2px solid ${primaryColor};
      padding-bottom: 20px;
      margin-bottom: 40px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    
    header .meta-theme {
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: ${secondaryColor};
      font-weight: 600;
    }
    
    header .meta-date {
      font-size: 0.9rem;
      color: #64748b;
    }
    
    h1 {
      font-family: 'Playfair Display', serif;
      font-size: 2.8rem;
      color: ${primaryColor};
      margin-top: 0;
      margin-bottom: 10px;
      font-weight: 700;
      line-height: 1.2;
    }
    
    h2 {
      font-family: 'Playfair Display', serif;
      font-size: 1.8rem;
      color: ${secondaryColor};
      margin-top: 30px;
      margin-bottom: 15px;
      border-bottom: 1px dashed ${secondaryColor}44;
      padding-bottom: 8px;
      page-break-after: avoid;
    }
    
    h3 {
      font-size: 1.25rem;
      color: ${primaryColor};
      margin-top: 25px;
      margin-bottom: 10px;
      page-break-after: avoid;
    }
    
    p {
      margin-bottom: 20px;
      font-size: 1.05rem;
    }
    
    ul, ol {
      margin-bottom: 20px;
      padding-left: 20px;
    }
    
    li {
      margin-bottom: 8px;
      font-size: 1.05rem;
    }
    
    pre {
      background-color: #f8fafc;
      border-left: 4px solid ${primaryColor};
      border: 1px solid #e2e8f0;
      border-left-width: 4px;
      border-left-color: ${primaryColor};
      padding: 15px;
      border-radius: 4px;
      overflow-x: auto;
      margin: 15px 0;
      page-break-inside: avoid;
    }
    
    code {
      font-family: 'Fira Code', monospace;
      font-size: 0.95rem;
      color: #0f172a;
      white-space: pre-wrap;
      word-break: break-all;
    }
    
    footer {
      margin-top: 60px;
      border-top: 1px solid #e2e8f0;
      padding-top: 20px;
      text-align: center;
      font-size: 0.85rem;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="prompt-container">
    <header>
      <div class="meta-theme">Theme: ${theme.name}</div>
      <div class="meta-date">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
    </header>
    
    <div class="content">
      ${promptGuideContent}
    </div>
    
    <footer>
      🤖 Daily Automated AI Prompt Guide • Premium Assets • Published on Gumroad
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
    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
    
    // Output full bleed A4 page print with zero margin offset
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

    await browser.close();
    console.log(`Prompt guide PDF compiled and saved to: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error('Failed to generate prompt guide PDF:', error);
    const outputPath = path.join(outputDir, 'prompt-guide.pdf');
    fs.writeFileSync(outputPath, 'Placeholder Prompt Guide PDF Content');
    return outputPath;
  }
}

