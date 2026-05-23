import { GoogleGenAI } from '@google/genai';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { DailyTheme } from '../types';
import { GEMINI_API_KEY, ROTATING_NICHES } from '../config';

export async function generateReport(theme: DailyTheme, outputDir: string, dayIndex: number): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not defined in environment variables.');
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  // Select a niche based on day index to rotate topics
  const niche = ROTATING_NICHES[dayIndex % ROTATING_NICHES.length];
  console.log(`Generating trend report for niche: "${niche}" under theme: "${theme.name}"...`);

  const prompt = `You are a professional market analyst and copywriter. Generate a detailed, premium market trend report for the niche: "${niche}".
The theme/aesthetic style of the report is "${theme.name}" which is described as: ${theme.description}.

Generate the content in HTML format (ONLY the body content inside a container, do not include <html>, <head>, or <body> tags). Use headings (<h2>, <h3>), paragraphs (<p>), bullet lists (<ul>, <li>), tables (<table>, <tr>, <th>, <td>), and strong tags (<strong>) where appropriate.

The report must contain:
1. A catchy Title (e.g. "The Rise of X: Niche Analysis") inside an <h1> tag.
2. Executive Summary: What is changing in this niche right now? (Provide at least 2 hypothetical/actual metrics or percentages).
3. Core Trends Analysis: Identify and explain 3 key trends shaping this niche.
4. Actionable Steps: Provide a bulleted list of 5 concrete recommendations for professionals or businesses to capitalize on these trends.

Write in a highly informative, premium, and professional tone. Avoid placeholder text.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    const reportContent = response.text || '';
    if (!reportContent) {
      throw new Error('Gemini API returned an empty text response for the report.');
    }

    // HTML Page template with CSS styles using the theme's colors
    const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${theme.name} Trend Report</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');
    
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
      font-size: 1.2rem;
      color: ${theme.colors.primary};
      margin-top: 20px;
      margin-bottom: 10px;
    }
    
    p {
      margin-bottom: 20px;
      font-size: 1.05rem;
      text-align: justify;
    }
    
    ul, ol {
      margin-bottom: 20px;
      padding-left: 20px;
    }
    
    li {
      margin-bottom: 8px;
      font-size: 1.05rem;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 30px 0;
    }
    
    th {
      background-color: ${theme.colors.primary};
      color: ${theme.colors.background};
      text-align: left;
      padding: 12px;
      font-weight: 600;
    }
    
    td {
      padding: 12px;
      border-bottom: 1px solid ${theme.colors.secondary}22;
    }
    
    tr:nth-child(even) {
      background-color: ${theme.colors.secondary}0d;
    }
    
    .accent-callout {
      background-color: ${theme.colors.accent}15;
      border-left: 4px solid ${theme.colors.accent};
      padding: 20px;
      margin: 30px 0;
      border-radius: 0 8px 8px 0;
    }
    
    .accent-callout p {
      margin: 0;
      font-style: italic;
      color: ${theme.colors.text};
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
      ${reportContent}
    </div>
    
    <div class="accent-callout">
      <p>Aesthetic Philosophy: "${theme.name}" brings together ${theme.aesthetic.toLowerCase()}</p>
    </div>
    
    <footer>
      🤖 Daily Automated Trend Digest • Premium Niche Report • Published on Gumroad
    </footer>
  </div>
</body>
</html>
    `;

    const outputPath = path.join(outputDir, 'trend-report.pdf');

    // Compile to PDF using Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'] // essential for running in Linux / GitHub Actions
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
    console.log(`Trend report PDF compiled and saved to: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error('Failed to generate trend report PDF:', error);
    // Write a fallback text/pdf in case of failure
    const outputPath = path.join(outputDir, 'trend-report.pdf');
    fs.writeFileSync(outputPath, 'Placeholder Report PDF Content');
    return outputPath;
  }
}
