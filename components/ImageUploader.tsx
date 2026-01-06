
import React, { useState, useCallback, useRef } from 'react';
import { UploadIcon } from './IconComponents';

interface ImageUploaderProps {
  onFileSelect: (file: File | null) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onFileSelect }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      onFileSelect(null);
      setPreview(null);
    }
  }, [onFileSelect]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
       if (fileInputRef.current) {
        fileInputRef.current.files = event.dataTransfer.files;
       }
      onFileSelect(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [onFileSelect]);
  
  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      event.stopPropagation();
  };

  return (
    <div>
      <label 
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="cursor-pointer block w-full p-4 border-2 border-dashed border-gray-600 rounded-lg text-center hover:border-yellow-400 transition-colors"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        {preview ? (
          <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-md" />
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-400">
            <UploadIcon className="w-10 h-10 mb-2" />
            <span className="font-semibold">Click to upload or drag & drop</span>
            <span className="text-sm">PNG, JPG, WEBP, etc.</span>
          </div>
        )}
      </label>
      {preview && (
        <button
          onClick={() => {
            setPreview(null);
            onFileSelect(null);
            if(fileInputRef.current) fileInputRef.current.value = "";
          }}
          className="mt-2 text-sm text-red-400 hover:text-red-300"
        >
          Remove image
        </button>
      )}
    </div>
  );
};

export default ImageUploader;
