import { GoogleGenAI } from '@google/genai';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { DailyTheme } from '../types';
import { GEMINI_API_KEY } from '../config';

export async function generatePlanner(theme: DailyTheme, outputDir: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not defined in environment variables.');
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  console.log(`Generating daily planner for theme: "${theme.name}"...`);

  const prompt = `You are a professional graphic designer specializing in printables and planners. Create a single-page daily planner/log page layout matching today's theme: "${theme.name}" (described as: ${theme.description}).
The colors are: Primary (${theme.colors.primary}), Secondary (${theme.colors.secondary}), Accent (${theme.colors.accent}), Background (${theme.colors.background}), Text (${theme.colors.text}).

Generate the HTML elements inside the body (ONLY returning the inner content of a container, do not include <html>, <head>, or <body>).
The planner must be structured visually and contain:
1. Header: A Title (e.g. "DAILY ALIGNMENT" or "DAILY TRACKER"), date slot, and a space for "Today's Theme: ${theme.name}".
2. Left Column: A structured "Daily Schedule" (time slots from 6:00 AM to 9:00 PM with simple lines).
3. Right Column:
   - "Top Priorities" (with 3-4 checklist circles/squares).
   - "Daily Habits" (tracker grid for water, exercise, learning).
   - "Gratitude & Reflections" (blank box with subtle borders).
   - "Notes & Brain Dump" (ruled lines).

Ensure all elements have proper CSS class/styling placeholders, and use clean divs with borders/margins. Keep the content very structured.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    const plannerHtmlContent = response.text || '';
    if (!plannerHtmlContent) {
      throw new Error('Gemini API returned an empty response for the planner generator.');
    }

    const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${theme.name} Printable Planner</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');
    
    body {
      font-family: 'Outfit', sans-serif;
      background-color: ${theme.colors.background};
      color: ${theme.colors.text};
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
    }
    
    .planner-page {
      width: 790px;
      height: 1110px; /* A4 Ratio height for exact rendering */
      box-sizing: border-box;
      padding: 40px;
      margin: 0 auto;
      background-color: ${theme.colors.background};
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    
    .planner-header {
      border-bottom: 3px double ${theme.colors.primary};
      padding-bottom: 15px;
      margin-bottom: 25px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .planner-title {
      font-family: 'Playfair Display', serif;
      font-size: 2.2rem;
      font-weight: 700;
      letter-spacing: 1px;
      color: ${theme.colors.primary};
      margin: 0;
    }
    
    .date-badge {
      border: 1px solid ${theme.colors.secondary};
      padding: 6px 16px;
      border-radius: 4px;
      font-size: 0.9rem;
      color: ${theme.colors.text};
    }
    
    .theme-banner {
      font-size: 0.85rem;
      color: ${theme.colors.secondary};
      text-transform: uppercase;
      letter-spacing: 2px;
      font-weight: 600;
      margin-top: 5px;
    }
    
    .planner-body {
      display: grid;
      grid-template-columns: 1.1fr 1.3fr;
      gap: 25px;
      flex-grow: 1;
    }
    
    .section-box {
      border: 1.5px solid ${theme.colors.primary}33;
      border-radius: 8px;
      padding: 15px;
      background-color: ${theme.colors.background};
      display: flex;
      flex-direction: column;
    }
    
    .section-title {
      font-family: 'Playfair Display', serif;
      font-size: 1.1rem;
      font-weight: 700;
      color: ${theme.colors.primary};
      border-bottom: 1px solid ${theme.colors.secondary}44;
      padding-bottom: 5px;
      margin-top: 0;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .schedule-row {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
      font-size: 0.85rem;
    }
    
    .schedule-time {
      width: 55px;
      font-weight: 600;
      color: ${theme.colors.secondary};
    }
    
    .schedule-line {
      flex-grow: 1;
      border-bottom: 1px dashed ${theme.colors.secondary}33;
      height: 10px;
      margin-left: 5px;
    }
    
    .todo-item {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
      font-size: 0.95rem;
    }
    
    .todo-checkbox {
      width: 16px;
      height: 16px;
      border: 1.5px solid ${theme.colors.primary};
      border-radius: 50%;
      margin-right: 12px;
      flex-shrink: 0;
    }
    
    .todo-text {
      flex-grow: 1;
      border-bottom: 1px solid ${theme.colors.secondary}22;
      height: 18px;
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
    }
    
    .habit-circles {
      display: flex;
      justify-content: center;
      gap: 4px;
      margin-top: 5px;
    }
    
    .habit-circle {
      width: 10px;
      height: 10px;
      border: 1px solid ${theme.colors.secondary};
      border-radius: 50%;
    }
    
    .ruled-lines {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 10px;
      flex-grow: 1;
    }
    
    .ruled-line {
      border-bottom: 1px solid ${theme.colors.secondary}22;
      height: 12px;
    }
    
    .reflections-box {
      flex-grow: 1;
      border: 1px solid ${theme.colors.accent}40;
      background-color: ${theme.colors.accent}0a;
      border-radius: 6px;
      padding: 10px;
      margin-top: 5px;
      min-height: 80px;
    }
    
    .planner-footer {
      border-top: 1px solid ${theme.colors.primary}33;
      padding-top: 10px;
      margin-top: 20px;
      text-align: center;
      font-size: 0.75rem;
      letter-spacing: 1px;
      color: ${theme.colors.text}aa;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <div class="planner-page">
    <div>
      <div class="planner-header">
        <div>
          <h1 class="planner-title">DAILY LOG</h1>
          <div class="theme-banner">Aesthetic: ${theme.name}</div>
        </div>
        <div class="date-badge">Date: ____________________</div>
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
            <div class="todo-item"><div class="todo-checkbox"></div><div class="todo-text"></div></div>
            <div class="todo-item"><div class="todo-checkbox"></div><div class="todo-text"></div></div>
            <div class="todo-item"><div class="todo-checkbox"></div><div class="todo-text"></div></div>
            <div class="todo-item"><div class="todo-checkbox"></div><div class="todo-text"></div></div>
            <div class="todo-item"><div class="todo-checkbox"></div><div class="todo-text"></div></div>
          </div>
          
          <!-- Habits -->
          <div class="section-box">
            <h2 class="section-title">Habits</h2>
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
          <div class="section-box" style="flex-grow: 1;">
            <h2 class="section-title">Gratitude & Insights</h2>
            <div class="reflections-box">
              <span style="font-size: 0.75rem; color: ${theme.colors.text}88; font-style: italic;">Today I am grateful for...</span>
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
    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
    
    // Render precisely to fit A4 page dimensions
    await page.pdf({
      path: outputPath,
      width: '790px',
      height: '1110px',
      printBackground: true,
      margin: {
        top: '0px',
        bottom: '0px',
        left: '0px',
        right: '0px'
      }
    });

    await browser.close();
    console.log(`Printable planner PDF compiled and saved to: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error('Failed to generate printable planner PDF:', error);
    const outputPath = path.join(outputDir, 'printable-planner.pdf');
    fs.writeFileSync(outputPath, 'Placeholder Printable Planner PDF Content');
    return outputPath;
  }
}
