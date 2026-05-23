// Utility functions for daily flow product generators

/**
 * Cleans Gemini's HTML outputs to prevent clashing styles
 * - Strips out markdown code block wraps (```html ... ```)
 * - Removes inline style tags and style blocks to enforce our global theme CSS
 */
export function cleanHtml(html: string): string {
  let clean = html.trim();
  
  // Strip markdown HTML wraps if present
  if (clean.startsWith('```html')) {
    clean = clean.substring(7);
  } else if (clean.startsWith('```')) {
    clean = clean.substring(3);
  }
  
  if (clean.endsWith('```')) {
    clean = clean.substring(0, clean.length - 3);
  }
  
  clean = clean.trim();
  
  // Remove style blocks: <style>...</style>
  clean = clean.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  
  // Remove inline style attributes: style="..."
  clean = clean.replace(/\sstyle=(["'])([\s\S]*?)\1/gi, '');
  
  return clean;
}

// Convert Hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace('#', '');
  const r = parseInt(normalized.substring(0, 2), 16);
  const g = parseInt(normalized.substring(2, 4), 16);
  const b = parseInt(normalized.substring(4, 6), 16);
  return { r, g, b };
}

// Convert RGB to Hex
function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
  const toHex = (val: number) => clamp(val).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Calculate Relative Luminance
function getLuminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

// Calculate Contrast Ratio
function getContrastRatio(lum1: number, lum2: number): number {
  const l1 = Math.max(lum1, lum2);
  const l2 = Math.min(lum1, lum2);
  return (l1 + 0.05) / (l2 + 0.05);
}

/**
 * Programmatically adjusts color contrast to meet WCAG AA standards (4.5:1 ratio)
 * If the color does not have sufficient contrast against background, it darkens or lightens it.
 */
export function ensureContrast(colorHex: string, backgroundHex: string, minRatio: number = 4.5): string {
  try {
    const bgRgb = hexToRgb(backgroundHex);
    const bgLum = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
    
    let textRgb = hexToRgb(colorHex);
    let textLum = getLuminance(textRgb.r, textRgb.g, textRgb.b);
    
    let ratio = getContrastRatio(textLum, bgLum);
    if (ratio >= minRatio) {
      return colorHex; // Contrast is already good
    }
    
    // Determine whether to darken or lighten
    const bgIsLight = bgLum > 0.5;
    
    let { r, g, b } = textRgb;
    let factor = bgIsLight ? 0.9 : 1.1; // Darken for light backgrounds, lighten for dark
    
    // Iteratively adjust color component values until contrast ratio is reached
    for (let i = 0; i < 50; i++) {
      r = bgIsLight ? r * factor : 255 - (255 - r) / factor;
      g = bgIsLight ? g * factor : 255 - (255 - g) / factor;
      b = bgIsLight ? b * factor : 255 - (255 - b) / factor;
      
      textLum = getLuminance(r, g, b);
      ratio = getContrastRatio(textLum, bgLum);
      
      if (ratio >= minRatio) {
        break;
      }
    }
    
    return rgbToHex(r, g, b);
  } catch {
    // If parsing fails, default to a safe high-contrast charcoal for light backgrounds
    return backgroundHex.toLowerCase() === '#ffffff' || backgroundHex.toLowerCase() === '#fafafa' 
      ? '#0f172a' 
      : '#ffffff';
  }
}
