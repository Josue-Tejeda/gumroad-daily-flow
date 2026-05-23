import { GoogleGenAI } from '@google/genai';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { DailyTheme } from '../types';
import { GEMINI_API_KEY } from '../config';
import { ensureContrast } from '../utils';

export async function generatePlanner(theme: DailyTheme, outputDir: string): Promise<string> {
  console.log(`Generating daily planner content for theme: "${theme.name}"...`);

  let quote = 'Make today count, one step at a time.';
  let gratitudePrompt = 'What is one thing you are grateful for today?';
  let priorities = ['Focus on daily tasks', 'Keep a positive mindset', 'Align with your goals'];

  if (GEMINI_API_KEY) {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const prompt = `You are a professional life organizer and graphic designer. Today's theme is: "${theme.name}" (described as: ${theme.description}).
Generate theme-specific content for today's daily planner:
1. A motivating daily quote or affirmation (1 short sentence) tailored to the theme.
2. A creative gratitude prompt tailored to the theme (e.g., if theme is minimalist: "List one thing you can let go of to create mental space").
3. 3 suggested priorities or focus tasks (brief, max 6 words each) that align with this theme (e.g., "Declutter digital files", "Meditate for 5 minutes").

Return the response matching the specified JSON schema.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              quote: { type: 'STRING', description: 'A daily quote or affirmation matching the theme' },
              gratitudePrompt: { type: 'STRING', description: 'A customized gratitude prompt helper text' },
              priorities: {
                type: 'ARRAY',
                items: { type: 'STRING' },
                description: 'Exactly 3 suggested focus tasks or priorities matching the theme (brief, max 6 words each)'
              }
            },
            required: ['quote', 'gratitudePrompt', 'priorities']
          }
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      if (parsed.quote) quote = parsed.quote.trim();
      if (parsed.gratitudePrompt) gratitudePrompt = parsed.gratitudePrompt.trim();
      if (parsed.priorities && Array.isArray(parsed.priorities)) {
        priorities = parsed.priorities.map((p: string) => p.trim());
      }
    } catch (err) {
      console.warn('Failed to generate or parse Gemini daily planner response. Using safe fallbacks.', err);
    }
  } else {
    console.warn('GEMINI_API_KEY is not defined. Using mock data fallbacks for daily planner.');
  }

  try {
    // Compute contrast-safe colors
    const primaryColor = ensureContrast(theme.colors.primary, '#ffffff', 4.5);
    const secondaryColor = ensureContrast(theme.colors.secondary, '#ffffff', 4.5);
    const accentColor = ensureContrast(theme.colors.accent, '#ffffff', 4.5);

    const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${theme.name} Printable Planner</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;800&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');
    
    body {
      font-family: 'Outfit', sans-serif;
      background-color: #ffffff;
      color: #0f172a; /* High-contrast dark charcoal body text */
      margin: 0;
      padding: 0;
      line-height: 1.4;
      -webkit-print-color-adjust: exact;
    }
    
    .planner-page {
      max-width: 800px;
      margin: 0 auto;
      padding: 50px 40px;
      box-sizing: border-box;
      min-height: 297mm; /* Standard A4 height */
      background-color: #ffffff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    
    .planner-header {
      border-bottom: 2px solid ${primaryColor};
      padding-bottom: 15px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .planner-title {
      font-family: 'Playfair Display', serif;
      font-size: 2.4rem;
      font-weight: 700;
      letter-spacing: 1px;
      color: ${primaryColor};
      margin: 0;
    }
    
    .date-badge {
      border: 1.5px solid ${secondaryColor};
      padding: 6px 16px;
      border-radius: 4px;
      font-size: 0.9rem;
      font-weight: 500;
      color: #475569;
    }
    
    .theme-banner {
      font-size: 0.85rem;
      color: ${secondaryColor};
      text-transform: uppercase;
      letter-spacing: 2px;
      font-weight: 600;
      margin-top: 5px;
    }
    
    .quote-container {
      margin-top: -5px;
      margin-bottom: 25px;
      padding: 12px 20px;
      background-color: ${primaryColor}08;
      border-left: 3px solid ${primaryColor};
      border-radius: 0 6px 6px 0;
      font-style: italic;
      font-size: 0.95rem;
      color: #334155;
      line-height: 1.4;
    }
    
    .quote-mark {
      font-family: 'Playfair Display', serif;
      font-size: 1.4rem;
      font-weight: bold;
      color: ${primaryColor};
      line-height: 0;
      vertical-align: middle;
    }
    
    .planner-body {
      display: grid;
      grid-template-columns: 1fr 1.15fr;
      gap: 25px;
      flex-grow: 1;
    }
    
    .section-box {
      border: 1.5px solid ${primaryColor}22;
      border-radius: 8px;
      padding: 15px;
      background-color: #ffffff;
      display: flex;
      flex-direction: column;
    }
    
    .section-title {
      font-family: 'Playfair Display', serif;
      font-size: 1.15rem;
      font-weight: 700;
      color: ${primaryColor};
      border-bottom: 1.5px solid ${primaryColor}22;
      padding-bottom: 6px;
      margin-top: 0;
      margin-bottom: 15px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .schedule-row {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
      font-size: 0.85rem;
    }
    
    .schedule-time {
      width: 60px;
      font-weight: 600;
      color: ${secondaryColor};
    }
    
    .schedule-line {
      flex-grow: 1;
      border-bottom: 1px dashed #cbd5e1;
      height: 10px;
      margin-left: 10px;
    }
    
    .todo-item {
      display: flex;
      align-items: center;
      margin-bottom: 15px;
      font-size: 0.95rem;
    }
    
    .todo-checkbox {
      width: 16px;
      height: 16px;
      border: 1.5px solid ${primaryColor};
      border-radius: 50%;
      margin-right: 12px;
      flex-shrink: 0;
    }
    
    .todo-text {
      flex-grow: 1;
      border-bottom: 1px solid #e2e8f0;
      height: 18px;
    }
    
    .todo-text.prefilled {
      color: #334155;
      font-weight: 500;
      line-height: 18px;
    }
    
    .habit-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-top: 5px;
    }
    
    .habit-item {
      text-align: center;
      font-size: 0.8rem;
      font-weight: 500;
      color: #475569;
    }
    
    .habit-circles {
      display: flex;
      justify-content: center;
      gap: 4px;
      margin-top: 6px;
    }
    
    .habit-circle {
      width: 11px;
      height: 11px;
      border: 1.5px solid ${secondaryColor};
      border-radius: 50%;
    }
    
    .reflections-box {
      border: 1px solid ${accentColor}25;
      background-color: ${accentColor}06;
      border-radius: 6px;
      padding: 10px;
      margin-bottom: 15px;
      min-height: 50px;
    }
    
    .ruled-lines {
      display: flex;
      flex-direction: column;
      gap: 14px;
      margin-top: 10px;
      flex-grow: 1;
    }
    
    .ruled-line {
      border-bottom: 1px dashed #cbd5e1;
      height: 16px;
    }
    
    .planner-footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 15px;
      margin-top: 25px;
      text-align: center;
      font-size: 0.75rem;
      letter-spacing: 1px;
      color: #64748b;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <div class="planner-page">
    <div>
      <div class="planner-header">
        <div>
          <h1 class="planner-title">DAILY PLANNER</h1>
          <div class="theme-banner">Aesthetic: ${theme.name}</div>
        </div>
        <div class="date-badge">Date: ____________________</div>
      </div>
      
      <div class="quote-container">
        <span class="quote-mark">“</span>${quote}<span class="quote-mark">”</span>
      </div>
      
      <div class="planner-body">
        <!-- Schedule Column -->
        <div class="section-box">
          <h2 class="section-title">Schedule</h2>
          <div class="schedule-row"><span class="schedule-time">06:00 AM</span><div class="schedule-line"></div></div>
          <div class="schedule-row"><span class="schedule-time">07:00 AM</span><div class="schedule-line"></div></div>
          <div class="schedule-row"><span class="schedule-time">08:00 AM</span><div class="schedule-line"></div></div>
          <div class="schedule-row"><span class="schedule-time">09:00 AM</span><div class="schedule-line"></div></div>
          <div class="schedule-row"><span class="schedule-time">10:00 AM</span><div class="schedule-line"></div></div>
          <div class="schedule-row"><span class="schedule-time">11:00 AM</span><div class="schedule-line"></div></div>
          <div class="schedule-row"><span class="schedule-time">12:00 PM</span><div class="schedule-line"></div></div>
          <div class="schedule-row"><span class="schedule-time">01:00 PM</span><div class="schedule-line"></div></div>
          <div class="schedule-row"><span class="schedule-time">02:00 PM</span><div class="schedule-line"></div></div>
          <div class="schedule-row"><span class="schedule-time">03:00 PM</span><div class="schedule-line"></div></div>
          <div class="schedule-row"><span class="schedule-time">04:00 PM</span><div class="schedule-line"></div></div>
          <div class="schedule-row"><span class="schedule-time">05:00 PM</span><div class="schedule-line"></div></div>
          <div class="schedule-row"><span class="schedule-time">06:00 PM</span><div class="schedule-line"></div></div>
          <div class="schedule-row"><span class="schedule-time">07:00 PM</span><div class="schedule-line"></div></div>
          <div class="schedule-row"><span class="schedule-time">08:00 PM</span><div class="schedule-line"></div></div>
          <div class="schedule-row"><span class="schedule-time">09:00 PM</span><div class="schedule-line"></div></div>
        </div>
        
        <!-- Priorities, Habits, and Reflections Column -->
        <div style="display: flex; flex-direction: column; gap: 20px;">
          <!-- Priorities -->
          <div class="section-box" style="flex-grow: 1;">
            <h2 class="section-title">Top Priorities</h2>
            <div class="todo-item"><div class="todo-checkbox"></div><div class="todo-text prefilled">${priorities[0] || ''}</div></div>
            <div class="todo-item"><div class="todo-checkbox"></div><div class="todo-text prefilled">${priorities[1] || ''}</div></div>
            <div class="todo-item"><div class="todo-checkbox"></div><div class="todo-text prefilled">${priorities[2] || ''}</div></div>
            <div class="todo-item"><div class="todo-checkbox"></div><div class="todo-text"></div></div>
            <div class="todo-item"><div class="todo-checkbox"></div><div class="todo-text"></div></div>
          </div>
          
          <!-- Habits -->
          <div class="section-box">
            <h2 class="section-title">Habit Tracker</h2>
            <div class="habit-grid">
              <div class="habit-item">
                <span>Water</span>
                <div class="habit-circles">
                  <div class="habit-circle"></div>
                  <div class="habit-circle"></div>
                  <div class="habit-circle"></div>
                  <div class="habit-circle"></div>
                </div>
              </div>
              <div class="habit-item">
                <span>Exercise</span>
                <div class="habit-circles">
                  <div class="habit-circle"></div>
                  <div class="habit-circle"></div>
                </div>
              </div>
              <div class="habit-item">
                <span>Read</span>
                <div class="habit-circles">
                  <div class="habit-circle"></div>
                  <div class="habit-circle"></div>
                </div>
              </div>
              <div class="habit-item">
                <span>Sleep</span>
                <div class="habit-circles">
                  <div class="habit-circle"></div>
                  <div class="habit-circle"></div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Reflections / Gratitude -->
          <div class="section-box" style="flex-grow: 1.2;">
            <h2 class="section-title">Gratitude & Reflections</h2>
            <div class="reflections-box">
              <div style="font-size: 0.78rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Daily Reflection Prompt</div>
              <div style="font-size: 0.85rem; color: #334155; font-style: italic; line-height: 1.3;">"${gratitudePrompt}"</div>
            </div>
            <div class="ruled-lines">
              <div class="ruled-line"></div>
              <div class="ruled-line"></div>
              <div class="ruled-line"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="planner-footer">
      Designed Daily • Theme: ${theme.name} • Coordinated Collection
    </div>
  </div>
</body>
</html>
    `;

    const outputPath = path.join(outputDir, 'printable-planner.pdf');

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
        console.warn('Failed to wait for fonts to load in planner compiler:', err);
      }
      
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

      console.log(`Printable planner PDF compiled and saved to: ${outputPath}`);
      return outputPath;
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error('Failed to generate printable planner PDF:', error);
    throw error;
  }
}

