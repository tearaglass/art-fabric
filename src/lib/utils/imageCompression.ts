/**
 * Utilities for compressing and optimizing PNG images
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1
}

/**
 * Compress a base64 PNG image
 */
export async function compressPNG(
  base64Data: string,
  options: CompressionOptions = {}
): Promise<string> {
  const { maxWidth = 1024, maxHeight = 1024, quality = 0.8 } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }

      // Create canvas and draw resized image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Convert to base64 with compression
      const compressed = canvas.toDataURL('image/png', quality);
      resolve(compressed);
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = base64Data;
  });
}

/**
 * Get the size in KB of a base64 string
 */
export function getBase64SizeKB(base64: string): number {
  const base64String = base64.split(',')[1] || base64;
  const padding = (base64String.match(/=/g) || []).length;
  const bytes = (base64String.length * 3) / 4 - padding;
  return bytes / 1024;
}

/**
 * Check if a base64 image should be compressed
 */
export function shouldCompress(base64: string, thresholdKB: number = 500): boolean {
  return getBase64SizeKB(base64) > thresholdKB;
}
