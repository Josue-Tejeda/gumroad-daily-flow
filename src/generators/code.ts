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
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not defined in environment variables.');
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  console.log(`Generating code kit for theme: "${theme.name}"...`);

  const prompt = `You are a Senior Full-Stack Engineer. Create a cohesive developer asset (e.g., a React component, a CSS dashboard template, or an automation utility script) matching the theme "${theme.name}" (described as: ${theme.description}).
The colors to integrate are: Primary (${theme.colors.primary}), Secondary (${theme.colors.secondary}), Accent (${theme.colors.accent}), Background (${theme.colors.background}), Text (${theme.colors.text}).

Generate the code files. Your response must be in JSON matching the schema, containing a list of files with their filenames and contents.
You must include at least:
1. "README.md" explaining what the component is, how to run/use it, and listing the features.
2. A main component or script file (e.g., "Component.jsx" or "script.js" or "styles.css").
3. A configuration or helper file (e.g., "theme.json" or "utils.js").

Make the code functional, clean, and highly polished. Do not write dummy comments; write real code.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
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

    const { files } = JSON.parse(response.text) as { files: GeneratedFile[] };
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
    // Write a fallback zip
    const outputPath = path.join(outputDir, 'code-boilerplate.zip');
    
    // Create dummy text zip
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 1 } });
    archive.pipe(output);
    archive.append('Fallback README content', { name: 'README.md' });
    await archive.finalize();
    
    return outputPath;
  }
}
