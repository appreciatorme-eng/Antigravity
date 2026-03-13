'use client';

import { useState } from 'react';
import { Upload, X } from 'lucide-react';

export interface TemplateMetadata {
  name: string;
  destination: string;
  durationDays: number;
  description: string;
  heroImageUrl: string;
  basePrice: number;
  tags: string[];
  isPublic: boolean;
}

export interface MetadataFormProps {
  metadata: TemplateMetadata;
  onUpdate: (updates: Partial<TemplateMetadata>) => void;
}

export function MetadataForm({ metadata, onUpdate }: MetadataFormProps) {
  const [tagInput, setTagInput] = useState('');

  const addTag = () => {
    if (tagInput.trim() && !metadata.tags.includes(tagInput.trim())) {
      onUpdate({ tags: [...metadata.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    onUpdate({ tags: metadata.tags.filter((t) => t !== tag) });
  };

  return (
    <div className="bg-white rounded-2xl border border-[#eadfcd] p-6">
      <h2 className="text-lg font-semibold text-[#1b140a] mb-4">Basic Information</h2>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-[#6f5b3e] mb-2">
            Template Name *
          </label>
          <input
            type="text"
            value={metadata.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="e.g., Classic Dubai 5D/4N"
            className="w-full px-4 py-2 border border-[#eadfcd] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#6f5b3e] mb-2">
            Destination *
          </label>
          <input
            type="text"
            value={metadata.destination}
            onChange={(e) => onUpdate({ destination: e.target.value })}
            placeholder="e.g., Dubai, UAE"
            className="w-full px-4 py-2 border border-[#eadfcd] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-[#6f5b3e] mb-2">
            Duration (Days)
          </label>
          <input
            type="number"
            value={metadata.durationDays}
            onChange={(e) => onUpdate({ durationDays: parseInt(e.target.value) || 0 })}
            min="1"
            className="w-full px-4 py-2 border border-[#eadfcd] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#6f5b3e] mb-2">
            Base Price ($)
          </label>
          <input
            type="number"
            value={metadata.basePrice}
            onChange={(e) => onUpdate({ basePrice: parseFloat(e.target.value) || 0 })}
            min="0"
            step="0.01"
            className="w-full px-4 py-2 border border-[#eadfcd] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-[#6f5b3e] mb-2">
          Description
        </label>
        <textarea
          value={metadata.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          rows={3}
          placeholder="Brief description of this tour..."
          className="w-full px-4 py-2 border border-[#eadfcd] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-[#6f5b3e] mb-2">
          Hero Image URL
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            value={metadata.heroImageUrl}
            onChange={(e) => onUpdate({ heroImageUrl: e.target.value })}
            placeholder="https://example.com/image.jpg"
            className="flex-1 px-4 py-2 border border-[#eadfcd] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
          />
          <button className="px-4 py-2 border border-[#eadfcd] rounded-lg hover:bg-gray-50 transition-colors">
            <Upload className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-[#6f5b3e] mb-2">Tags</label>
        <div className="flex gap-2 mb-2 flex-wrap">
          {metadata.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-3 py-1 bg-[#f8f1e6] text-sm text-[#6f5b3e] rounded-full"
            >
              {tag}
              <button onClick={() => removeTag(tag)} className="hover:text-red-600">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            placeholder="Add tag..."
            className="flex-1 px-4 py-2 border border-[#eadfcd] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c7c46]/20"
          />
          <button
            onClick={addTag}
            className="px-4 py-2 bg-[#9c7c46] text-white rounded-lg hover:bg-[#8a6d3e] transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isPublic"
          checked={metadata.isPublic}
          onChange={(e) => onUpdate({ isPublic: e.target.checked })}
          className="w-4 h-4 text-[#9c7c46] border-gray-300 rounded focus:ring-[#9c7c46]"
        />
        <label htmlFor="isPublic" className="text-sm text-[#6f5b3e]">
          Make this template public (visible to other organizations)
        </label>
      </div>
    </div>
  );
}
