'use client';

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

// Scaled up significantly for large viewports
const screens = [
  {
    id: 1,
    src: '/dashboard_ui_mockup_1773059467134.png',
    alt: 'Dashboard',
    delay: 0.1,
    top: '-40px', left: '0px',
    width: 720, height: 430,
    rotate: '-2deg', depth: 1,
  },
  {
    id: 2,
    src: '/analytics_ui_mockup_1773062281103.png',
    alt: 'Analytics',
    delay: 0.2,
    top: '-20px', left: '490px',
    width: 540, height: 324,
    rotate: '2.5deg', depth: 3,
  },
  {
    id: 3,
    src: '/crm_ui_mockup_1773059519930.png',
    alt: 'CRM',
    delay: 0.15,
    top: '330px', left: '-30px',
    width: 780, height: 468,
    rotate: '-1deg', depth: 2,
  },
  {
    id: 4,
    src: '/booking_ui_mockup_1773059498138.png',
    alt: 'Bookings',
    delay: 0.25,
    top: '350px', left: '540px',
    width: 540, height: 324,
    rotate: '3deg', depth: 1,
  },
  {
    id: 5,
    src: '/itinerary_ui_mockup_1773062264651.png',
    alt: 'Itinerary',
    delay: 0.3,
    top: '730px', left: '50px',
    width: 620, height: 372,
    rotate: '-1.5deg', depth: 2,
  },
  {
    id: 6,
    src: '/invoicing_ui_mockup_1773062297390.png',
    alt: 'Invoicing',
    delay: 0.35,
    top: '740px', left: '490px',
    width: 500, height: 300,
    rotate: '2deg', depth: 3,
  },
];

export function HeroScreens() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Smooth parallax via rAF loop
    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;

    const animate = () => {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;

      const cards = container.querySelectorAll<HTMLElement>('.parallax-card');
      cards.forEach((card) => {
        const depth = parseFloat(card.dataset.depth || '1');
        const rotate = card.dataset.rotate || '0deg';
        const tx = currentX * depth * 18;
        const ty = currentY * depth * 10;
        card.style.transform = `rotate(${rotate}) translateX(${tx}px) translateY(${ty}px)`;
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      // Normalize to -0.5 → 0.5 based on the section, not just container
      targetX = (e.clientX - rect.left - rect.width / 2) / rect.width;
      targetY = (e.clientY - rect.top - rect.height / 2) / rect.height;
    };

    const onMouseLeave = () => {
      targetX = 0;
      targetY = 0;
    };

    // Listen on the whole section (parent) so cursor anywhere in hero triggers parallax
    const section = container.closest('section');
    section?.addEventListener('mousemove', onMouseMove);
    section?.addEventListener('mouseleave', onMouseLeave);

    return () => {
      cancelAnimationFrame(rafRef.current);
      section?.removeEventListener('mousemove', onMouseMove);
      section?.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '58%',
        height: '100%',
        overflow: 'visible',
        zIndex: 10,
        pointerEvents: 'auto',
      }}
    >
      {/* Perspective tilt wrapper — gives the whole group a 3D look */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-55%, -50%) perspective(1600px) rotateY(-12deg) rotateX(4deg)',
          transformStyle: 'preserve-3d',
          width: '1100px',
          height: '1100px',
        }}
      >
        {screens.map(({ id, src, alt, delay, top, left, width, height, rotate, depth }) => (
          /* Entrance animation wrapper — no transform conflict with parallax */
          <motion.div
            key={id}
            initial={{ opacity: 0, y: 70, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.0, delay, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'absolute',
              top, left,
              width, height,
              zIndex: depth,
            }}
          >
            {/* Parallax target — JS writes transform here, no conflict */}
            <div
              className="parallax-card"
              data-depth={depth.toString()}
              data-rotate={rotate}
              style={{
                width: '100%',
                height: '100%',
                transform: `rotate(${rotate})`,
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 24px 70px rgba(0,0,0,0.8), 0 0 0 1px rgba(0,240,255,0.18)',
                willChange: 'transform',
                cursor: 'default',
                transition: 'box-shadow 0.3s ease',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.boxShadow =
                  '0 32px 90px rgba(0,0,0,0.85), 0 0 0 1.5px rgba(0,240,255,0.5)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.boxShadow =
                  '0 24px 70px rgba(0,0,0,0.8), 0 0 0 1px rgba(0,240,255,0.18)';
              }}
            >
              {/* Screen edge glow */}
              <div style={{
                position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
                borderRadius: '12px',
                boxShadow: 'inset 0 0 0 1px rgba(0,240,255,0.2)',
              }} />
              <Image
                src={src}
                alt={alt}
                width={width * 2}
                height={height * 2}
                priority={id <= 4}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: '15%', left: '25%',
        width: '600px', height: '500px', pointerEvents: 'none',
        background: 'radial-gradient(ellipse, rgba(0,240,255,0.07) 0%, rgba(0,112,243,0.05) 50%, transparent 70%)',
        zIndex: 1,
      }} />

      {/* Left fade — screens don't bleed into text */}
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0, width: '140px',
        background: 'linear-gradient(to right, #0A0A0A 30%, transparent)',
        zIndex: 20, pointerEvents: 'none',
      }} />

      {/* Bottom fade */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '120px',
        background: 'linear-gradient(to top, #0A0A0A, transparent)',
        zIndex: 20, pointerEvents: 'none',
      }} />
    </div>
  );
}
