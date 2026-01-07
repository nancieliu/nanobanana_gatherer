import { ImageData } from '../types';

/**
 * Converts a file to base64, with aggressive resizing to stay within
 * Gemini's strict input token limits for the free tier (avoids limit: 0 errors).
 */
export const fileToBase64 = (file: File): Promise<ImageData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Using 768px as a safer 'low-token' threshold for the Flash Image model
        const maxDim = 768;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height *= maxDim / width;
            width = maxDim;
          } else {
            width *= maxDim / height;
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context failed'));

        ctx.drawImage(img, 0, 0, width, height);
        
        // Lower quality to 0.7 to further reduce base64 string length/token count
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        const base64 = dataUrl.split(',')[1];
        const mimeType = 'image/jpeg';
        
        resolve({ base64, mimeType });
      };
      img.src = reader.result as string;
    };
    reader.onerror = (error) => reject(error);
  });
};

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

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.max(14, img.width / 45)}px sans-serif`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      
      const padding = 20;
      const displayDate = `GATHERING MEMORY • ${date}`;
      ctx.fillText(displayDate, canvas.width - padding, img.height + (footerHeight / 2));
      
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = `${Math.max(10, img.width / 65)}px sans-serif`;
      ctx.fillText("CREATED WITH GATHERER AI", padding, img.height + (footerHeight / 2));

      resolve(canvas.toDataURL('image/jpeg', 0.85).split(',')[1]);
    };
    img.src = `data:image/jpeg;base64,${base64Str}`;
  });
};