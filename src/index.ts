import fs from 'fs';
import path from 'path';
import { generateDailyTheme } from './generators/theme';
import { generateWallpaper } from './generators/wallpaper';
import { generateReport } from './generators/report';
import { generateCode } from './generators/code';
import { generatePrompts } from './generators/prompts';
import { generatePlanner } from './generators/planner';
import { createProduct, publishProduct } from './gumroad';
import { PRODUCT_CONFIGS, GITHUB_REPOSITORY, GITHUB_BRANCH, GEMINI_API_KEY, FAL_KEY, GUMROAD_ACCESS_TOKEN, ROTATING_NICHES } from './config';
import { GeneratedProduct, DailyTheme } from './types';

// Helper to format date as YYYY-MM-DD
function getDateString(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function run() {
  const isTest = process.argv.includes('--test') || process.argv.includes('-t');
  const dateStr = getDateString();
  const assetsDir = path.join(process.cwd(), 'assets', dateStr);

  console.log('==================================================');
  console.log(`🚀 STARTING DAILY GUMROAD STORE FLOW: ${dateStr}`);
  if (isTest) {
    console.log('🧪 RUNNING IN TEST/MOCK MODE (NO API CHARGES, SIMULATED GUMROAD CALLS)');
  }
  console.log('==================================================');

  // Verify directories
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
    console.log(`Created assets directory: ${assetsDir}`);
  }

  // 1. Generate/Fetch Theme
  let theme: DailyTheme;
  if (isTest || !GEMINI_API_KEY) {
    console.log('Loading mock theme for testing...');
    theme = {
      name: 'Retro Synthwave Neon',
      description: 'A vibrant 80s inspired retro-future aesthetic full of digital glowing energy.',
      aesthetic: 'Chrome grids, neon violet and hot pink gradients, vector wireframes, dark background, and retro sci-fi typography.',
      keywords: ['synthwave', '80s', 'neon', 'retro-future', 'outrun', 'cyan', 'magenta'],
      colors: {
        primary: '#090514',      // Deep indigo background
        secondary: '#ec4899',    // Hot pink
        accent: '#06b6d4',       // Neon cyan
        background: '#fafafa',   // Off-white canvas for print
        text: '#1e1b4b'          // Indigo-black body text
      }
    };
  } else {
    theme = await generateDailyTheme();
  }

  console.log(`\nPalette Selected:`);
  console.log(`- Primary:    ${theme.colors.primary}`);
  console.log(`- Secondary:  ${theme.colors.secondary}`);
  console.log(`- Accent:     ${theme.colors.accent}`);
  console.log(`- Background: ${theme.colors.background}`);
  console.log(`- Text:       ${theme.colors.text}`);

  // Determine Niche for today (rotates through options)
  const dayIndex = new Date().getDate(); // uses day of the month as offset
  const todayNiche = ROTATING_NICHES[dayIndex % ROTATING_NICHES.length];

  // 2. Generate Assets
  const generatedProducts: GeneratedProduct[] = [];

  // Define files we generate
  const assetDefinitions = [
    { type: 'wallpaper', file: 'wallpaper.png', generate: () => generateWallpaper(theme, assetsDir) },
    { type: 'report', file: 'trend-report.pdf', generate: () => generateReport(theme, assetsDir, dayIndex) },
    { type: 'code', file: 'code-boilerplate.zip', generate: () => generateCode(theme, assetsDir) },
    { type: 'prompts', file: 'prompt-guide.pdf', generate: () => generatePrompts(theme, assetsDir) },
    { type: 'planner', file: 'printable-planner.pdf', generate: () => generatePlanner(theme, assetsDir) }
  ];

  for (const asset of assetDefinitions) {
    console.log(`\n[${asset.type.toUpperCase()}] Creating asset...`);
    
    let localFilePath = '';
    try {
      localFilePath = await asset.generate();
    } catch (err) {
      console.error(`Error generating ${asset.type}, skipping:`, err);
      continue;
    }

    // Pre-calculate raw GitHub download link
    const downloadUrl = `https://raw.githubusercontent.com/${GITHUB_REPOSITORY}/${GITHUB_BRANCH}/assets/${dateStr}/${asset.file}`;

    // Get configuration
    const config = PRODUCT_CONFIGS[asset.type];
    
    // Format product metadata templates
    const name = config.nameTemplate.replace('{themeName}', theme.name);
    let description = config.descriptionTemplate
      .replace(/{themeName}/g, theme.name)
      .replace(/{themeAesthetic}/g, theme.aesthetic)
      .replace(/{niche}/g, todayNiche)
      .replace(/{downloadUrl}/g, downloadUrl);

    generatedProducts.push({
      type: asset.type as any,
      name,
      description,
      price: config.price,
      localPath: localFilePath,
      filename: asset.file,
      downloadUrl
    });
  }

  // 3. Publish to Gumroad
  console.log('\n==================================================');
  console.log('📦 PUBLISHING PRODUCTS TO GUMROAD...');
  console.log('==================================================');

  const publishedResults = [];

  for (const product of generatedProducts) {
    console.log(`\nPublishing ${product.type}: "${product.name}"...`);

    if (isTest || !GUMROAD_ACCESS_TOKEN) {
      console.log(`[SIMULATED] Created and Published product: ${product.name}`);
      console.log(`- Price: $${(product.price / 100).toFixed(2)}`);
      console.log(`- Deliver URL: ${product.downloadUrl}`);
      
      publishedResults.push({
        ...product,
        gumroadUrl: `https://gum.co/mock-${product.type}-${dateStr}`,
        productId: `mock_id_${product.type}_${dateStr}`,
        status: 'published'
      });
    } else {
      try {
        // Create Product on Gumroad
        const res = await createProduct(product.name, product.price, product.description);
        
        // Publish Product (make it live)
        const published = await publishProduct(res.id);
        
        publishedResults.push({
          ...product,
          gumroadUrl: res.short_url,
          productId: res.id,
          status: published ? 'published' : 'draft'
        });
      } catch (err: any) {
        const errorDetails = err.response?.data ? JSON.stringify(err.response.data) : err.message;
        console.error(`Failed to publish product ${product.name} to Gumroad:`, errorDetails);
        publishedResults.push({
          ...product,
          gumroadUrl: `FAILED: ${errorDetails}`,
          productId: 'FAILED',
          status: 'error'
        });
      }
    }
  }

  // 4. Save log history
  const historyFilePath = path.join(process.cwd(), 'assets', 'history.json');
  let historyLog: any[] = [];
  
  if (fs.existsSync(historyFilePath)) {
    try {
      historyLog = JSON.parse(fs.readFileSync(historyFilePath, 'utf8'));
    } catch {
      historyLog = [];
    }
  }

  const logEntry = {
    date: dateStr,
    theme: theme.name,
    niche: todayNiche,
    products: publishedResults.map(p => ({
      type: p.type,
      name: p.name,
      price: p.price,
      productId: p.productId,
      gumroadUrl: p.gumroadUrl,
      downloadUrl: p.downloadUrl,
      status: p.status
    }))
  };

  historyLog.unshift(logEntry); // Add to the top
  fs.writeFileSync(historyFilePath, JSON.stringify(historyLog, null, 2));
  console.log(`\nHistory log updated at: ${historyFilePath}`);

  // Display summary table
  console.log('\n==================================================');
  console.log('📊 RUN SUMMARY');
  console.log('==================================================');
  console.table(
    publishedResults.map(p => ({
      Type: p.type.toUpperCase(),
      Name: p.name,
      Price: p.price === 0 ? 'PWYW' : `$${(p.price / 100).toFixed(2)}`,
      Status: p.status,
      'Gumroad Shop URL': p.gumroadUrl
    }))
  );
  console.log('==================================================');
  console.log('🎉 Execution completed successfully!');
}

run().catch(err => {
  console.error('Fatal crash in main daily-flow orchestrator:', err);
  process.exit(1);
});
