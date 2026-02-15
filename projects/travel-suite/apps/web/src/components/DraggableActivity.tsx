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
  onReorder: (fromIndex: number, toIndex: number) => void;
  children: React.ReactNode;
}

export default function DraggableActivity({
  activity,
  index,
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

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        group relative transition-all
        ${isDragging ? 'opacity-50' : 'opacity-100'}
        ${isDragOver ? 'border-t-2 border-[#9c7c46]' : ''}
      `}
    >
      {/* Drag Handle */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -ml-6 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>

      {children}
    </div>
  );
}
