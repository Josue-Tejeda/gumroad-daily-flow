import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { DailyTheme } from '../types';
import { GEMINI_API_KEY } from '../config';

interface GeneratedFile {
  filename: string;
  content: string;
}

export async function generateCode(theme: DailyTheme, outputDir: string): Promise<string> {
  console.log(`Generating code kit for theme: "${theme.name}"...`);

  let files: GeneratedFile[];

  const fallbackFiles: GeneratedFile[] = [
    {
      filename: 'README.md',
      content: `# Cohesive Developer UI Asset - ${theme.name}

This developer asset is part of the coordinated daily collection matching the theme **${theme.name}**.

## Features
- Modular design styling.
- Responsive layout.
- Color variables matching theme palette.

## Colors
- Primary: \`${theme.colors.primary}\`
- Secondary: \`${theme.colors.secondary}\`
- Accent: \`${theme.colors.accent}\`
- Background: \`${theme.colors.background}\`
- Text: \`${theme.colors.text}\`
`
    },
    {
      filename: 'ThemeStyles.css',
      content: `:root {
  --primary-color: ${theme.colors.primary};
  --secondary-color: ${theme.colors.secondary};
  --accent-color: ${theme.colors.accent};
  --background-color: ${theme.colors.background};
  --text-color: ${theme.colors.text};
}

.theme-card {
  background: var(--background-color);
  color: var(--text-color);
  border: 1px solid var(--primary-color);
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.theme-card:hover {
  transform: translateY(-2px);
  border-color: var(--accent-color);
}

.theme-btn {
  background-color: var(--secondary-color);
  color: #ffffff;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
}
`
    },
    {
      filename: 'theme.json',
      content: JSON.stringify({
        name: theme.name,
        palette: theme.colors
      }, null, 2)
    }
  ];

  if (!GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY is not defined. Using mock files for code kit.');
    files = fallbackFiles;
  } else {
    try {
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      const prompt = `You are a Senior Full-Stack Engineer. Create a cohesive, premium developer asset (e.g., a complete React dashboard component, a Tailwind UI widget card, or an interactive animation helper script) matching the theme "${theme.name}" (described as: ${theme.description}).
The aesthetic styling details are: ${theme.aesthetic}.
The colors to integrate are:
- Primary (${theme.colors.primary})
- Secondary (${theme.colors.secondary})
- Accent (${theme.colors.accent})
- Background (${theme.colors.background})
- Text (${theme.colors.text})

Generate the code files. Your response must be in JSON matching the schema, containing a list of files with their filenames and contents.
You must include:
1. A detailed "README.md" written in a professional markdown style explaining the component, installation steps, configuration options, usage examples, and design system choices (including colors and theme inspiration).
2. A main, fully functional code asset (e.g., "Component.jsx", "Widget.tsx", or "index.html") that is clean, fully styled, utilizes modern design paradigms (e.g., glassmorphism, smooth CSS transitions, hover states), and is ready to copy-paste into a real project.
3. A styling or theme file (e.g., "theme.css", "tailwind.config.js", or "theme.json") defining CSS variables or configuration objects for all colors to make it easily themeable.

Do not write placeholders, dummy comments, or generic print statements. The code must be complete, modular, and immediately usable by professional developers.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              files: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    filename: { type: 'STRING', description: 'Relative path and filename, e.g. "Button.jsx" or "styles/theme.css"' },
                    content: { type: 'STRING', description: 'Full code or text content of the file' }
                  },
                  required: ['filename', 'content']
                }
              }
            },
            required: ['files']
          }
        }
      });

      if (!response.text) {
        throw new Error('Gemini API returned an empty response for code generation.');
      }

      const parsed = JSON.parse(response.text) as { files: GeneratedFile[] };
      files = parsed.files;
    } catch (err) {
      console.warn('Failed to generate code kit with Gemini API. Falling back to default files.', err);
      files = fallbackFiles;
    }
  }

  try {
    const tempDir = path.join(outputDir, 'temp-code');
    
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Write generated files to temp directory
    for (const file of files) {
      const filePath = path.join(tempDir, file.filename);
      const fileDir = path.dirname(filePath);
      
      if (!fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir, { recursive: true });
      }
      
      fs.writeFileSync(filePath, file.content);
      console.log(`Wrote temp code file: ${file.filename}`);
    }

    const outputPath = path.join(outputDir, 'code-boilerplate.zip');
    
    // Zip the files
    await new Promise<void>((resolve, reject) => {
      const output = fs.createWriteStream(outputPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => {
        console.log(`ZIP file created: ${outputPath} (${archive.pointer()} total bytes)`);
        resolve();
      });

      archive.on('error', (err) => {
        reject(err);
      });

      archive.pipe(output);
      archive.directory(tempDir, false);
      archive.finalize();
    });

    // Clean up temp directory
    fs.rmSync(tempDir, { recursive: true, force: true });
    console.log(`Cleaned up temp files for code generator.`);

    return outputPath;
  } catch (error) {
    console.error('Failed to generate code zip:', error);
    throw error;
  }
}
