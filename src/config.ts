import dotenv from 'dotenv';
import { ProductConfig } from './types';

dotenv.config();

// API Configuration
export const GUMROAD_ACCESS_TOKEN = process.env.GUMROAD_ACCESS_TOKEN || '';
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
export const FAL_KEY = process.env.FAL_KEY || '';

// GitHub Repository Configuration (used for constructing raw file URLs)
export const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY || 'Josue-Tejeda/gumroad-daily-flow';
export const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';

// Rotation list of topics/niches for reports & planners
export const ROTATING_NICHES = [
  'Productivity & Time Management',
  'Technology & Software Trends',
  'Mental Health & Self-Care',
  'Graphic Design & Creative Assets',
  'Personal Finance & Side Hustles',
  'Fitness, Nutrition & Daily Wellness'
];

// Product price and template configuration
export const PRODUCT_CONFIGS: Record<string, ProductConfig> = {
  wallpaper: {
    type: 'wallpaper',
    price: 0, // Pay What You Want (starts at $0)
    nameTemplate: 'Daily Cohesive Aesthetic Wallpaper - {themeName}',
    descriptionTemplate: `
<h3>🎨 Daily Cohesive Aesthetic Wallpaper</h3>
<p>Transform your workspace with today's high-resolution wallpaper generated under the central theme: <strong>{themeName}</strong>.</p>
<p><strong>Aesthetic Description:</strong> {themeAesthetic}</p>
<p><strong>What is included:</strong></p>
<ul>
  <li>1 x Ultra High-Resolution PNG wallpaper (suitable for desktop, laptop, or tablet screen dimensions)</li>
  <li>Unique theme-matching palette details</li>
</ul>
<p><em>This product is offered as a Pay-What-You-Want download. Enter $0 to download it for free, or support our automated creation engine by contributing what you wish!</em></p>
<hr />
<p><strong>🔗 YOUR SECURE DOWNLOAD LINK:</strong></p>
<p><a href="{downloadUrl}" target="_blank" style="padding: 10px 20px; background-color: #0284c7; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Download Wallpaper File</a></p>
<p><em>(If the link doesn't open, copy and paste this URL into your browser: {downloadUrl})</em></p>
`
  },
  planner: {
    type: 'planner',
    price: 0, // Pay What You Want (starts at $0)
    nameTemplate: 'Daily Cohesive Printable Planner & Log - {themeName}',
    descriptionTemplate: `
<h3>📅 Daily Cohesive Printable Planner / Tracker</h3>
<p>Organize your day with a beautiful, printable daily planner that matches today's aesthetic: <strong>{themeName}</strong>.</p>
<p><strong>What is included:</strong></p>
<ul>
  <li>1 x Beautifully styled PDF sheet designed for daily tasks, tracking habits, and notes</li>
  <li>Optimized formatting suitable for standard letter size (A4/US Letter) printing</li>
  <li>Coordinated theme graphics and colors</li>
</ul>
<p><em>This product is offered as a Pay-What-You-Want download. Enter $0 to download it for free, or support our automated creation engine by contributing what you wish!</em></p>
<hr />
<p><strong>🔗 YOUR SECURE DOWNLOAD LINK:</strong></p>
<p><a href="{downloadUrl}" target="_blank" style="padding: 10px 20px; background-color: #0284c7; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Download PDF Planner</a></p>
<p><em>(If the link doesn't open, copy and paste this URL into your browser: {downloadUrl})</em></p>
`
  },
  prompts: {
    type: 'prompts',
    price: 0, // Pay What You Want (starts at $0)
    nameTemplate: 'Daily Cohesive AI Prompt Recipe Pack - {themeName}',
    descriptionTemplate: `
<h3>💡 Daily Cohesive AI Prompt Recipe Pack</h3>
<p>Unlock the power of generative AI. This pack contains curated, battle-tested prompts matching today's theme: <strong>{themeName}</strong>.</p>
<p><strong>What is included:</strong></p>
<ul>
  <li>1 x PDF file containing 5 structured text prompts (for ChatGPT/Claude) and 3 image prompts (for Midjourney/Stable Diffusion) centered around the theme</li>
  <li>Usage guides and explanation of placeholders</li>
</ul>
<p><em>This product is offered as a Pay-What-You-Want download. Enter $0 to download it for free, or support our automated creation engine by contributing what you wish!</em></p>
<hr />
<p><strong>🔗 YOUR SECURE DOWNLOAD LINK:</strong></p>
<p><a href="{downloadUrl}" target="_blank" style="padding: 10px 20px; background-color: #0284c7; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Download PDF Prompt Guide</a></p>
<p><em>(If the link doesn't open, copy and paste this URL into your browser: {downloadUrl})</em></p>
`
  },
  report: {
    type: 'report',
    price: 299, // $2.99
    nameTemplate: 'Daily Cohesive Trend Report & News Digest - {themeName}',
    descriptionTemplate: `
<h3>📈 Daily Cohesive Trend Report & News Digest</h3>
<p>Stay ahead of the curve. Today's premium analytical report covers the latest happenings in <strong>{niche}</strong>, written and styled under the theme: <strong>{themeName}</strong>.</p>
<p><strong>What is included:</strong></p>
<ul>
  <li>1 x Premium multi-page PDF newsletter/report</li>
  <li>Insightful analysis, industry metrics, and dynamic summaries of current trends</li>
  <li>Fully styled typography and layout aligned with today's aesthetic palette</li>
</ul>
<p><em>This is a premium product. Purchase today to get instant access to our daily curated trend analysis!</em></p>
<hr />
<p><strong>🔗 YOUR SECURE DOWNLOAD LINK:</strong></p>
<p><a href="{downloadUrl}" target="_blank" style="padding: 10px 20px; background-color: #0284c7; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Download PDF Report</a></p>
<p><em>(If the link doesn't open, copy and paste this URL into your browser: {downloadUrl})</em></p>
`
  },
  code: {
    type: 'code',
    price: 299, // $2.99
    nameTemplate: 'Daily Cohesive Code Boilerplate & UI Kit - {themeName}',
    descriptionTemplate: `
<h3>💻 Daily Cohesive Code Boilerplate & UI Kit</h3>
<p>Accelerate your development. Today's premium developer asset is a code snippet, script, or component styled and themed around: <strong>{themeName}</strong>.</p>
<p><strong>What is included:</strong></p>
<ul>
  <li>1 x ZIP archive containing files, scripts, or components (e.g. React components, raw CSS, or automation tools)</li>
  <li>Modular, clean code matching today's central theme and visual style</li>
  <li>Complete documentation file (README.md) inside the folder</li>
</ul>
<p><em>This is a premium developer product. Purchase today to get instant access to our daily code boilerplate!</em></p>
<hr />
<p><strong>🔗 YOUR SECURE DOWNLOAD LINK:</strong></p>
<p><a href="{downloadUrl}" target="_blank" style="padding: 10px 20px; background-color: #0284c7; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Download ZIP Code Kit</a></p>
<p><em>(If the link doesn't open, copy and paste this URL into your browser: {downloadUrl})</em></p>
`
  }
};
