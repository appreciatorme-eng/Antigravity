'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface TextRevealProps {
  children: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
}

export function TextReveal({
  children,
  className = '',
  as: Tag = 'p',
}: TextRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const words = el.querySelectorAll('.tr-word');

    gsap.set(words, { y: '100%', opacity: 0 });

    const tl = gsap.to(words, {
      y: '0%',
      opacity: 1,
      duration: 0.6,
      ease: 'power3.out',
      stagger: 0.08,
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        once: true,
      },
    });

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, [children]);

  const words = children.split(/\s+/);

  return (
    <Tag className={className} ref={containerRef as React.RefObject<never>}>
      {words.map((word, i) => (
        <span key={`${word}-${i}`} className="inline-block overflow-hidden mr-[0.25em]">
          <span className="tr-word inline-block">{word}</span>
        </span>
      ))}
    </Tag>
  );
}
