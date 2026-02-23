/**
 * Draggable Activity Component
 *
 * Supports drag-and-drop reordering of activities within a day
 * Updates display_order in database on drop
 */

'use client';

import { useState } from 'react';
import { GripVertical } from 'lucide-react';

interface DraggableActivityProps {
  activity: {
    id: string;
    title: string;
    time?: string | null;
    description?: string | null;
    price: number;
    display_order: number;
    is_optional?: boolean;
    is_premium?: boolean;
  };
  index: number;
  totalItems?: number;
  onReorder: (fromIndex: number, toIndex: number) => void;
  children: React.ReactNode;
}

export default function DraggableActivity({
  activity,
  index,
  totalItems,
  onReorder,
  children,
}: DraggableActivityProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (fromIndex !== index) {
      onReorder(fromIndex, index);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (!e.altKey) return;

    if (e.key === 'ArrowUp') {
      if (index <= 0) return;
      e.preventDefault();
      onReorder(index, index - 1);
      return;
    }

    if (e.key === 'ArrowDown') {
      const maxIndex = typeof totalItems === 'number' ? totalItems - 1 : Number.POSITIVE_INFINITY;
      if (index >= maxIndex) return;
      e.preventDefault();
      onReorder(index, index + 1);
      return;
    }

    if (e.key === 'Home') {
      if (index <= 0) return;
      e.preventDefault();
      onReorder(index, 0);
      return;
    }

    if (e.key === 'End' && typeof totalItems === 'number') {
      const lastIndex = totalItems - 1;
      if (index >= lastIndex) return;
      e.preventDefault();
      onReorder(index, lastIndex);
    }
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onKeyDown={handleKeyDown}
      role="listitem"
      tabIndex={0}
      aria-grabbed={isDragging}
      aria-label={`Activity ${activity.title}. Press Alt plus Arrow keys to reorder.`}
      className={`
        group relative transition-all
        ${isDragging ? 'opacity-50' : 'opacity-100'}
        ${isDragOver ? 'border-t-2 border-[#9c7c46]' : ''}
      `}
    >
      {/* Drag Handle */}
      <div
        className="absolute left-0 top-1/2 -translate-y-1/2 -ml-6 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        aria-hidden="true"
      >
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>

      {children}
    </div>
  );
}
