import { GoogleGenAI } from '@google/genai';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { DailyTheme } from '../types';
import { GEMINI_API_KEY, ROTATING_NICHES } from '../config';
import { ensureContrast } from '../utils';

interface Metric {
  label: string;
  value: string;
}

interface Trend {
  title: string;
  tagline: string;
  description: string;
  implication: string;
}

interface Recommendation {
  title: string;
  action: string;
}

interface ReportData {
  title: string;
  executiveSummary: string;
  metrics: Metric[];
  trends: Trend[];
  recommendations: Recommendation[];
  quote: string;
}

export async function generateReport(theme: DailyTheme, outputDir: string, dayIndex: number): Promise<string> {
  const niche = ROTATING_NICHES[dayIndex % ROTATING_NICHES.length];
  console.log(`Generating structured trend report for niche: "${niche}" under theme: "${theme.name}"...`);
  
  let data: ReportData;

  const fallbackData: ReportData = {
    title: `The Future of ${niche}: A Daily Study`,
    executiveSummary: `This executive summary outlines the major shifts occurring in the ${niche} sector. As modern aesthetics adapt, we see a blending of design principles and structural efficiency. This daily report provides a detailed synthesis of these trends.`,
    metrics: [
      { label: 'Projected Growth Rate', value: '+18.4% YoY' },
      { label: 'Consumer Sentiment Index', value: '84.2 / 100' }
    ],
    trends: [
      {
        title: 'Hyper-Personalization of Content',
        tagline: 'Tailoring user experiences dynamically to individual preferences.',
        description: 'Modern platforms are shifting from broad category matching to continuous hyper-personalized recommendation streams. By leveraging low-latency data loops, services can adapt visual layouts and text styles to the user\'s real-time mood.',
        implication: 'Businesses must build modular asset architectures that support real-time rendering and assembly.'
      },
      {
        title: 'Decentralized Workspaces',
        tagline: 'The migration from central hubs to distributed design systems.',
        description: 'Collaboration is no longer locked to a single physical office or desktop file. Distributed git-based and cloud-native workflows have democratized digital resource sharing, requiring creators to design assets that translate across various devices.',
        implication: 'Optimizing file delivery and establishing consistent visual design tokens is now mandatory.'
      },
      {
        title: 'Sustainably Manufactured Digital Products',
        tagline: 'Reducing the carbon and computational footprint of cloud assets.',
        description: 'As generative AI adoption scales, the energy cost of rendering high-fidelity assets is facing closer scrutiny. Organizations are seeking lighter models and pre-compiled assets to minimize network transfer costs.',
        implication: 'Optimize image sizing and use native CSS layouts rather than rendering large raster images.'
      }
    ],
    recommendations: [
      { title: 'Standardize Design Tokens', action: 'Integrate CSS custom properties for theme colors to enable instant visual adaptations.' },
      { title: 'Optimize PDF File Weights', action: 'Ensure background styles use efficient gradients and minimize embedded heavy images.' },
      { title: 'Publish Cohesive Daily Collections', action: 'Group assets around a central daily aesthetic theme to increase customer basket size.' },
      { title: 'Establish Safe Fallbacks', action: 'Ensure all critical user flows have safe offline or default fallbacks if external APIs fail.' },
      { title: 'Enforce Accessibility Standards', action: 'Verify contrast ratios programmatically to ensure all generated text meets WCAG AA 4.5:1 ratio.' }
    ],
    quote: 'Efficiency is doing things right; effectiveness is doing the right things.'
  };

  if (!GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY is not defined. Using mock data for trend report.');
    data = fallbackData;
  } else {
    try {
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      const prompt = `You are a professional market analyst and senior research consultant. Generate a highly detailed, premium market trend report for the niche: "${niche}".
The theme/aesthetic style of the report is "${theme.name}" which is described as: ${theme.description}.

Generate the content and return a JSON response matching the schema. Give real, insightful, and publication-ready content (no placeholders, no generic text).
The report must include:
1. An engaging, publication-ready title.
2. A detailed Executive Summary (approx. 100-150 words) with industry analysis.
3. Exactly 2 key metrics/stats (e.g. market growth %, consumer adoption rate) to feature in a highlight layout.
4. Exactly 3 core trends shaping this niche. For each trend, write:
   - A descriptive title
   - A short tagline/summary (1 sentence)
   - A detailed explanation (1-2 paragraphs) of how it works and why it matters
   - The key business implication
5. Exactly 5 actionable recommendations for creators, professionals, or businesses looking to capitalize on this.
6. A memorable industry quote or key takeaway.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              title: { type: 'STRING', description: 'Catchy, professional title for the report' },
              executiveSummary: { type: 'STRING', description: 'High-level summary of the report contents and findings' },
              metrics: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    label: { type: 'STRING', description: 'Description of the metric (e.g., Projected Market Valuation)' },
                    value: { type: 'STRING', description: 'Percentage or value (e.g., +24.5% YoY)' }
                  },
                  required: ['label', 'value']
                },
                description: 'Exactly 2 market metrics or statistics'
              },
              trends: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    title: { type: 'STRING', description: 'Title of the trend' },
                    tagline: { type: 'STRING', description: 'One-sentence summary of the trend' },
                    description: { type: 'STRING', description: 'Detailed 1-2 paragraph description of the trend' },
                    implication: { type: 'STRING', description: 'Direct business or strategic implication of the trend' }
                  },
                  required: ['title', 'tagline', 'description', 'implication']
                },
                description: 'Exactly 3 core industry trends'
              },
              recommendations: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    title: { type: 'STRING', description: 'Action title (e.g., Optimize Mobile Checkout)' },
                    action: { type: 'STRING', description: 'Detailed instruction on how to execute this action' }
                  },
                  required: ['title', 'action']
                },
                description: 'Exactly 5 actionable recommendations'
              },
              quote: { type: 'STRING', description: 'Key takeaway quote' }
            },
            required: ['title', 'executiveSummary', 'metrics', 'trends', 'recommendations', 'quote']
          }
        }
      });

      if (!response.text) {
        throw new Error('Gemini API returned an empty response for the trend report.');
      }

      data = JSON.parse(response.text) as ReportData;
    } catch (err) {
      console.warn('Failed to generate trend report with Gemini API. Falling back to high-quality default data.', err);
      data = fallbackData;
    }
  }

  // Compute contrast-safe text colors against the white (#ffffff) page background
  const primaryColor = ensureContrast(theme.colors.primary, '#ffffff', 4.5);
  const secondaryColor = ensureContrast(theme.colors.secondary, '#ffffff', 4.5);
  const accentColor = ensureContrast(theme.colors.accent, '#ffffff', 4.5);

  // Generate HTML for Metrics
  const metricsHtml = data.metrics.map(m => `
    <div class="metric-card">
      <div class="metric-value" style="color: ${primaryColor};">${m.value}</div>
      <div class="metric-label">${m.label}</div>
    </div>
  `).join('');

  // Generate HTML for Trends
  const trendsHtml = data.trends.map((t, idx) => `
    <div class="trend-card">
      <div class="trend-header">
        <span class="trend-num" style="background-color: ${primaryColor};">0${idx + 1}</span>
        <h3 class="trend-title" style="color: ${primaryColor};">${t.title}</h3>
      </div>
      <div class="trend-tagline" style="color: ${secondaryColor};">${t.tagline}</div>
      <p class="trend-desc">${t.description}</p>
      <div class="trend-implication">
        <strong>Strategic Implication:</strong> ${t.implication}
      </div>
    </div>
  `).join('');

  // Generate HTML for Recommendations
  const recsHtml = data.recommendations.map((r, idx) => `
    <li class="rec-item">
      <strong style="color: ${primaryColor};">${idx + 1}. ${r.title}</strong> — ${r.action}
    </li>
  `).join('');

  const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${data.title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
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
    
    .report-container {
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
      font-family: 'Lora', serif;
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
      font-family: 'Lora', serif;
      font-size: 1.6rem;
      color: ${primaryColor};
      margin-top: 40px;
      margin-bottom: 20px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 8px;
      page-break-after: avoid;
    }
    
    .summary-text {
      font-size: 1.05rem;
      color: #334155;
      text-align: justify;
      margin-bottom: 30px;
    }
    
    .metrics-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 40px;
    }
    
    .metric-card {
      background-color: #f8fafc;
      border-radius: 8px;
      padding: 20px;
      border-top: 4px solid ${accentColor};
      text-align: center;
    }
    
    .metric-value {
      font-size: 2.2rem;
      font-weight: 800;
      margin-bottom: 5px;
    }
    
    .metric-label {
      font-size: 0.9rem;
      color: #475569;
      font-weight: 500;
    }
    
    .trend-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 25px;
      margin-bottom: 25px;
      page-break-inside: avoid;
    }
    
    .trend-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 10px;
    }
    
    .trend-num {
      color: #ffffff;
      font-size: 0.85rem;
      font-weight: bold;
      padding: 4px 8px;
      border-radius: 4px;
    }
    
    .trend-title {
      font-family: 'Lora', serif;
      font-size: 1.25rem;
      margin: 0;
      font-weight: 700;
    }
    
    .trend-tagline {
      font-size: 0.95rem;
      font-weight: 600;
      margin-bottom: 12px;
      font-style: italic;
    }
    
    .trend-desc {
      font-size: 1rem;
      margin: 0 0 15px 0;
      color: #334155;
      text-align: justify;
    }
    
    .trend-implication {
      background-color: #f8fafc;
      border-left: 3px solid ${secondaryColor};
      padding: 10px 15px;
      font-size: 0.95rem;
      color: #475569;
    }
    
    .recs-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    .rec-item {
      font-size: 1rem;
      margin-bottom: 15px;
      padding-bottom: 15px;
      border-bottom: 1px solid #f1f5f9;
    }
    
    .rec-item:last-child {
      border-bottom: none;
    }
    
    .quote-box {
      background: linear-gradient(135deg, ${primaryColor}08, ${accentColor}08);
      border-left: 4px solid ${accentColor};
      padding: 25px;
      border-radius: 0 8px 8px 0;
      margin-top: 40px;
      margin-bottom: 40px;
      font-style: italic;
      font-family: 'Lora', serif;
      font-size: 1.15rem;
      color: #0f172a;
      text-align: center;
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
  <div class="report-container">
    <div>
      <header>
        <div class="meta-theme">REPORT • THEME: ${theme.name}</div>
        <div class="meta-date">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
      </header>
      
      <h1>${data.title}</h1>
      <div class="subtitle">Daily Analysis: Cohesive Trend Insights & Strategies for the ${niche} Niche</div>
      
      <h2>Executive Summary</h2>
      <div class="summary-text">${data.executiveSummary}</div>
      
      <div class="metrics-grid">
        ${metricsHtml}
      </div>
      
      <h2>Core Trends</h2>
      <div class="trends-container">
        ${trendsHtml}
      </div>
      
      <div style="page-break-before: always;"></div>
      
      <h2>Actionable Recommendations</h2>
      <ul class="recs-list">
        ${recsHtml}
      </ul>
      
      <div class="quote-box">
        “ ${data.quote} ”
      </div>
    </div>
    
    <footer>
      🤖 Coordinated Daily Suite • Powered by Gemini 2.5 Flash • Uncompromising Digital Asset Design
    </footer>
  </div>
</body>
</html>
  `;

  const outputPath = path.join(outputDir, 'trend-report.pdf');

  // Compile to PDF using Puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    // Use 'load' navigation and wait for fonts explicitly to handle network slowness
    await page.setContent(fullHtml, { waitUntil: 'load' });
    
    try {
      await page.evaluate(() => document.fonts.ready);
    } catch (err) {
      console.warn('Failed to wait for fonts to load in report compiler:', err);
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

    console.log(`Trend report PDF compiled and saved to: ${outputPath}`);
    return outputPath;
  } finally {
    await browser.close();
  }
}
