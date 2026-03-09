'use client';

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

const screens = [
  {
    id: 1,
    src: '/dashboard_ui_mockup_1773059467134.png',
    alt: 'Dashboard',
    delay: 0.1,
    style: {
      top: '-30px',
      left: '0px',
      width: 500,
      height: 300,
      rotate: '-2deg',
      zIndex: 4,
    },
  },
  {
    id: 2,
    src: '/analytics_ui_mockup_1773062281103.png',
    alt: 'Analytics',
    delay: 0.2,
    style: {
      top: '-10px',
      left: '340px',
      width: 380,
      height: 228,
      rotate: '2deg',
      zIndex: 3,
    },
  },
  {
    id: 3,
    src: '/crm_ui_mockup_1773059519930.png',
    alt: 'CRM',
    delay: 0.15,
    style: {
      top: '220px',
      left: '-20px',
      width: 540,
      height: 324,
      rotate: '-1deg',
      zIndex: 6,
    },
  },
  {
    id: 4,
    src: '/booking_ui_mockup_1773059498138.png',
    alt: 'Bookings',
    delay: 0.25,
    style: {
      top: '240px',
      left: '380px',
      width: 380,
      height: 228,
      rotate: '3deg',
      zIndex: 5,
    },
  },
  {
    id: 5,
    src: '/itinerary_ui_mockup_1773062264651.png',
    alt: 'Itinerary',
    delay: 0.3,
    style: {
      top: '490px',
      left: '40px',
      width: 420,
      height: 252,
      rotate: '-1.5deg',
      zIndex: 4,
    },
  },
  {
    id: 6,
    src: '/invoicing_ui_mockup_1773062297390.png',
    alt: 'Invoicing',
    delay: 0.35,
    style: {
      top: '500px',
      left: '360px',
      width: 340,
      height: 204,
      rotate: '2.5deg',
      zIndex: 3,
    },
  },
];

export function HeroScreens() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      const cards = container.querySelectorAll<HTMLElement>('[data-depth]');
      cards.forEach((card) => {
        const depth = parseFloat(card.dataset.depth || '1');
        const moveX = x * depth * 20;
        const moveY = y * depth * 12;
        card.style.transform = `${card.dataset.base || ''} translateX(${moveX}px) translateY(${moveY}px)`;
      });
    };

    const handleMouseLeave = () => {
      const cards = container.querySelectorAll<HTMLElement>('[data-depth]');
      cards.forEach((card) => {
        card.style.transition = 'transform 0.8s ease-out';
        card.style.transform = card.dataset.base || '';
        setTimeout(() => { card.style.transition = ''; }, 800);
      });
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    // Outer: takes up the right half of the hero section
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '55%',
        height: '100%',
        overflow: 'visible',
        zIndex: 10,
        pointerEvents: 'auto',
      }}
    >
      {/* Perspective wrapper — creates the 3D depth look */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-60%, -50%) perspective(1400px) rotateY(-10deg) rotateX(4deg)',
          transformStyle: 'preserve-3d',
          width: '760px',
          height: '740px',
        }}
      >
        {screens.map(({ id, src, alt, delay, style }) => {
          const baseTransform = `rotate(${style.rotate})`;
          const depth = ((id % 3) + 1).toString();
          return (
            <motion.div
              key={id}
              data-depth={depth}
              data-base={baseTransform}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ scale: 1.04, zIndex: 20, transition: { duration: 0.25 } }}
              style={{
                position: 'absolute',
                top: style.top,
                left: style.left,
                width: style.width,
                height: style.height,
                zIndex: style.zIndex,
                transform: baseTransform,
                borderRadius: '10px',
                overflow: 'hidden',
                boxShadow: '0 20px 60px rgba(0,0,0,0.75), 0 0 0 1px rgba(0,240,255,0.15)',
                cursor: 'default',
                willChange: 'transform',
              }}
            >
              {/* Inner glow border */}
              <div style={{
                position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
                borderRadius: '10px',
                boxShadow: 'inset 0 0 0 1px rgba(0,240,255,0.25)',
              }} />
              <Image
                src={src}
                alt={alt}
                width={style.width * 2}
                height={style.height * 2}
                priority={id <= 4}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </motion.div>
          );
        })}
      </div>

      {/* Ambient glow behind screens */}
      <div style={{
        position: 'absolute', top: '20%', left: '20%',
        width: '500px', height: '400px', pointerEvents: 'none',
        background: 'radial-gradient(ellipse, rgba(0,240,255,0.07) 0%, rgba(0,112,243,0.05) 50%, transparent 70%)',
        zIndex: 1,
      }} />

      {/* Left-side fade so screens don't overlap the text */}
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0, width: '120px',
        background: 'linear-gradient(to right, #0A0A0A, transparent)',
        zIndex: 15, pointerEvents: 'none',
      }} />

      {/* Bottom fade */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '100px',
        background: 'linear-gradient(to top, #0A0A0A, transparent)',
        zIndex: 15, pointerEvents: 'none',
      }} />
    </div>
  );
}
