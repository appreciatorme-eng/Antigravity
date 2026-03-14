'use client';

import React, { useRef, useState, useCallback } from 'react';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  tiltDegree?: number;
}

export function TiltCard({
  children,
  className = '',
  tiltDegree = 8,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState({ transform: 'perspective(800px) rotateX(0deg) rotateY(0deg)', transition: 'transform 0.1s ease' });
  const [glare, setGlare] = useState({ opacity: 0, x: 50, y: 50 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const xRel = (e.clientX - rect.left) / rect.width - 0.5;
    const yRel = (e.clientY - rect.top) / rect.height - 0.5;

    setStyle({
      transform: `perspective(800px) rotateX(${-yRel * tiltDegree}deg) rotateY(${xRel * tiltDegree}deg)`,
      transition: 'transform 0.1s ease',
    });
    setGlare({ opacity: 0.15, x: (xRel + 0.5) * 100, y: (yRel + 0.5) * 100 });
  }, [tiltDegree]);

  const handleMouseLeave = useCallback(() => {
    setStyle({
      transform: 'perspective(800px) rotateX(0deg) rotateY(0deg)',
      transition: 'transform 0.4s ease',
    });
    setGlare({ opacity: 0, x: 50, y: 50 });
  }, []);

  return (
    <div
      ref={ref}
      className={`relative ${className}`}
      style={style}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        style={{
          background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,${glare.opacity}), transparent 60%)`,
          transition: 'opacity 0.3s ease',
        }}
      />
    </div>
  );
}
