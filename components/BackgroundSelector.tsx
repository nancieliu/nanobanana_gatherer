
import React from 'react';
import { BackgroundOption } from '../types';

interface BackgroundSelectorProps {
  options: BackgroundOption[];
  selectedId: string;
  onSelect: (id: string) => void;
}

const BackgroundSelector: React.FC<BackgroundSelectorProps> = ({ options, selectedId, onSelect }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => onSelect(option.id)}
          className={`relative rounded-lg overflow-hidden border-2 transition-all duration-200 ${
            selectedId === option.id ? 'border-yellow-400 scale-105' : 'border-gray-700 hover:border-gray-500'
          }`}
        >
          <img src={option.thumbnailUrl} alt={option.name} className="w-full h-16 object-cover" />
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-1">
            <span className="text-white text-xs font-semibold text-center">{option.name}</span>
          </div>
        </button>
      ))}
    </div>
  );
};

export default BackgroundSelector;
