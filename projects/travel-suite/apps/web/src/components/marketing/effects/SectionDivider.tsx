import React from 'react';

interface SectionDividerProps {
  variant?: 'wave' | 'curve' | 'angle' | 'triangle';
  flip?: boolean;
  className?: string;
  color?: string;
}

const PATHS: Record<string, string> = {
  wave: 'M0,64 C320,128 640,0 960,64 C1280,128 1600,0 1920,64 L1920,200 L0,200 Z',
  curve: 'M0,160 Q960,0 1920,160 L1920,200 L0,200 Z',
  angle: 'M0,200 L1920,80 L1920,200 Z',
  triangle: 'M0,200 L960,60 L1920,200 Z',
};

export function SectionDivider({
  variant = 'wave',
  flip = false,
  className = '',
  color = '#0A0A0F',
}: SectionDividerProps) {
  return (
    <div
      className={`w-full leading-[0] ${className}`}
      style={flip ? { transform: 'scaleY(-1)' } : undefined}
    >
      <svg
        className="w-full h-auto"
        viewBox="0 0 1920 200"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d={PATHS[variant]} fill={color} />
      </svg>
    </div>
  );
}
