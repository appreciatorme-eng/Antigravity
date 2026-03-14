'use client';

import React from 'react';

interface GradientMeshProps {
  className?: string;
  colors?: string[];
}

const DEFAULT_COLORS = ['#FF6B2C', '#00D4AA', '#1a0533'];

export function GradientMesh({
  className = '',
  colors = DEFAULT_COLORS,
}: GradientMeshProps) {
  const [c1, c2, c3] = colors.length >= 3
    ? colors
    : [...colors, ...DEFAULT_COLORS].slice(0, 3);

  return (
    <div
      className={`absolute inset-0 overflow-hidden ${className}`}
      style={{ isolation: 'isolate' }}
    >
      <div
        className="absolute inset-0 animate-[meshMove1_8s_ease-in-out_infinite]"
        style={{
          background: `radial-gradient(circle at 30% 40%, ${c1}66 0%, transparent 60%)`,
          mixBlendMode: 'screen',
        }}
      />
      <div
        className="absolute inset-0 animate-[meshMove2_10s_ease-in-out_infinite]"
        style={{
          background: `radial-gradient(circle at 70% 60%, ${c2}66 0%, transparent 60%)`,
          mixBlendMode: 'screen',
        }}
      />
      <div
        className="absolute inset-0 animate-[meshMove3_12s_ease-in-out_infinite]"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${c3}66 0%, transparent 60%)`,
          mixBlendMode: 'screen',
        }}
      />
      <style jsx>{`
        @keyframes meshMove1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(5%, -8%) scale(1.1); }
        }
        @keyframes meshMove2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-8%, 5%) scale(1.15); }
        }
        @keyframes meshMove3 {
          0%, 100% { transform: translate(0, 0) scale(1.05); }
          50% { transform: translate(6%, 6%) scale(0.95); }
        }
      `}</style>
    </div>
  );
}
