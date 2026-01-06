
import { ImageData } from '../types';

export const fileToBase64 = (file: File): Promise<ImageData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      const mimeType = result.split(';')[0].split(':')[1];
      if (base64 && mimeType) {
        resolve({ base64, mimeType });
      } else {
        reject(new Error('Failed to parse base64 string from file.'));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Draws a footer with the date on the image using HTML5 Canvas
 */
export const addDateFooter = (base64Str: string, date: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(base64Str);

      const footerHeight = 60;
      canvas.width = img.width;
      canvas.height = img.height + footerHeight;

      // Draw background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Draw footer text
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.max(16, img.width / 40)}px sans-serif`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      
      const padding = 20;
      const displayDate = `GATHERING MEMORY • ${date}`;
      ctx.fillText(displayDate, canvas.width - padding, img.height + (footerHeight / 2));
      
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = `${Math.max(12, img.width / 60)}px sans-serif`;
      ctx.fillText("CREATED WITH GATHERER AI", padding, img.height + (footerHeight / 2));

      resolve(canvas.toDataURL('image/jpeg', 0.9).split(',')[1]);
    };
    img.src = `data:image/jpeg;base64,${base64Str}`;
  });
};
