import { GoogleGenAI } from '@google/genai';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { DailyTheme } from '../types';
import { GEMINI_API_KEY } from '../config';

export async function generatePrompts(theme: DailyTheme, outputDir: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not defined in environment variables.');
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  console.log(`Generating prompt pack for theme: "${theme.name}"...`);

  const prompt = `You are a Prompt Engineer expert. Generate a detailed, highly valuable AI Prompt Guide / Recipe Pack matching the theme: "${theme.name}" (described as: ${theme.description}).

Generate the content in HTML format (ONLY the body content inside a container, do not include <html>, <head>, or <body> tags). Use headings (<h2>, <h3>), paragraphs (<p>), code blocks (<pre><code>), lists (<ul>, <li>), and strong tags (<strong>).

The guide must contain:
1. An <h1> title matching the theme (e.g. "Creative Prompts for ${theme.name}").
2. Introduction: Briefly explain how these prompts unlock creative work related to the theme.
3. 3 x Text Prompts (for ChatGPT, Claude, Gemini): Write complete, copy-pasteable prompts with placeholders (e.g. [Insert Topic]) that help users write themed content, essays, or generate ideas in this aesthetic.
4. 2 x Image Prompts (for Midjourney, DALL-E, Stable Diffusion): Write descriptive, cinematic prompts designed to create artwork in this theme's style.
5. Provide a short explanation of tips for customizing each prompt.

Wrap the actual copy-pasteable prompt text inside <pre><code> tags so it is easy to read.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    const promptGuideContent = response.text || '';
    if (!promptGuideContent) {
      throw new Error('Gemini API returned empty text response for the prompt pack.');
    }

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
      background-color: ${theme.colors.background};
      color: ${theme.colors.text};
      margin: 0;
      padding: 0;
      line-height: 1.6;
    }
    
    .report-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
      box-sizing: border-box;
    }
    
    header {
      border-bottom: 2px solid ${theme.colors.primary};
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
      color: ${theme.colors.secondary};
      font-weight: 600;
    }
    
    header .meta-date {
      font-size: 0.9rem;
      color: ${theme.colors.text}88;
    }
    
    h1 {
      font-family: 'Playfair Display', serif;
      font-size: 2.8rem;
      color: ${theme.colors.primary};
      margin-top: 0;
      margin-bottom: 10px;
      font-weight: 700;
      line-height: 1.2;
    }
    
    h2 {
      font-family: 'Playfair Display', serif;
      font-size: 1.8rem;
      color: ${theme.colors.secondary};
      margin-top: 30px;
      margin-bottom: 15px;
      border-bottom: 1px dashed ${theme.colors.secondary}44;
      padding-bottom: 8px;
    }
    
    h3 {
      font-size: 1.25rem;
      color: ${theme.colors.primary};
      margin-top: 25px;
      margin-bottom: 10px;
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
      background-color: ${theme.colors.text}10;
      border-left: 4px solid ${theme.colors.primary};
      padding: 15px;
      border-radius: 4px;
      overflow-x: auto;
      margin: 15px 0;
    }
    
    code {
      font-family: 'Fira Code', monospace;
      font-size: 0.95rem;
      color: ${theme.colors.text};
      white-space: pre-wrap;
      word-break: break-all;
    }
    
    .prompt-box {
      margin-bottom: 40px;
      border: 1px solid ${theme.colors.secondary}33;
      padding: 20px;
      border-radius: 8px;
      background-color: ${theme.colors.background};
    }
    
    footer {
      margin-top: 60px;
      border-top: 1px solid ${theme.colors.secondary}44;
      padding-top: 20px;
      text-align: center;
      font-size: 0.85rem;
      color: ${theme.colors.text}88;
    }
  </style>
</head>
<body>
  <div class="report-container">
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
    await page.pdf({
      path: outputPath,
      format: 'A4',
      margin: {
        top: '15mm',
        bottom: '15mm',
        left: '15mm',
        right: '15mm'
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
