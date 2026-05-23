export interface DailyTheme {
  name: string;
  description: string;
  aesthetic: string;
  keywords: string[];
  colors: {
    primary: string;    // Hex code, e.g. "#0f172a"
    secondary: string;  // Hex code, e.g. "#0284c7"
    accent: string;     // Hex code, e.g. "#f59e0b"
    background: string; // Hex code, e.g. "#fafafa"
    text: string;       // Hex code, e.g. "#1e293b"
  };
}

export type ProductType = 'wallpaper' | 'report' | 'code' | 'prompts' | 'planner';

export interface ProductConfig {
  type: ProductType;
  price: number; // in cents (e.g. 299 for $2.99, 0 for PWYW)
  nameTemplate: string; // e.g. "Daily Art Wallpaper - {themeName}"
  descriptionTemplate: string; // HTML/Markdown description of the product
}

export interface GeneratedProduct {
  type: ProductType;
  name: string;
  description: string;
  price: number;
  localPath: string;
  filename: string;
  downloadUrl: string;
}
