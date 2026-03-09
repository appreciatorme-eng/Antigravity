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
    top: '-40px', left: '0px',
    width: 720, height: 430,
    rotate: '-2deg',
  },
  {
    id: 2,
    src: '/analytics_ui_mockup_1773062281103.png',
    alt: 'Analytics',
    delay: 0.2,
    top: '-20px', left: '490px',
    width: 540, height: 324,
    rotate: '2.5deg',
  },
  {
    id: 3,
    src: '/crm_ui_mockup_1773059519930.png',
    alt: 'CRM',
    delay: 0.15,
    top: '330px', left: '-30px',
    width: 780, height: 468,
    rotate: '-1deg',
  },
  {
    id: 4,
    src: '/booking_ui_mockup_1773059498138.png',
    alt: 'Bookings',
    delay: 0.25,
    top: '350px', left: '540px',
    width: 540, height: 324,
    rotate: '3deg',
  },
  {
    id: 5,
    src: '/itinerary_ui_mockup_1773062264651.png',
    alt: 'Itinerary',
    delay: 0.3,
    top: '730px', left: '50px',
    width: 620, height: 372,
    rotate: '-1.5deg',
  },
  {
    id: 6,
    src: '/invoicing_ui_mockup_1773062297390.png',
    alt: 'Invoicing',
    delay: 0.35,
    top: '740px', left: '490px',
    width: 500, height: 300,
    rotate: '2deg',
  },
];

// Base tilt of the whole group (the "resting" angle)
const BASE_ROTATE_Y = -12;
const BASE_ROTATE_X = 4;
// Max additional tilt from mouse
const MAX_TILT_Y = 10; // degrees left-right
const MAX_TILT_X = 7;  // degrees up-down

export function HeroScreens() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const target = useRef({ rx: BASE_ROTATE_X, ry: BASE_ROTATE_Y });
  const current = useRef({ rx: BASE_ROTATE_X, ry: BASE_ROTATE_Y });

  useEffect(() => {
    // rAF loop: smoothly lerp current rotation toward target
    const loop = () => {
      current.current.rx += (target.current.rx - current.current.rx) * 0.07;
      current.current.ry += (target.current.ry - current.current.ry) * 0.07;

      if (wrapperRef.current) {
        wrapperRef.current.style.transform =
          `translate(-55%, -50%) perspective(1600px) rotateY(${current.current.ry}deg) rotateX(${current.current.rx}deg)`;
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    // Listen on the window so mouse anywhere drives the effect
    const onMouseMove = (e: MouseEvent) => {
      // Normalize relative to the viewport: -0.5 to 0.5
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;

      target.current.ry = BASE_ROTATE_Y + nx * MAX_TILT_Y * 2;
      target.current.rx = BASE_ROTATE_X - ny * MAX_TILT_X * 2;
    };

    const onMouseLeave = () => {
      // Smoothly return to base on mouse leave
      target.current.rx = BASE_ROTATE_X;
      target.current.ry = BASE_ROTATE_Y;
    };

    window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseleave', onMouseLeave);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '58%',
        height: '100%',
        overflow: 'visible',
        zIndex: 10,
        pointerEvents: 'none', // don't block the hero text clicks
      }}
    >
      {/* 
        THE WHOLE GROUP ROTATES TOGETHER — exactly like Spline.
        The JS loop continuously updates rotateX/rotateY on this div 
        based on mouse position, giving the full 3D scene tilt effect.
      */}
      <div
        ref={wrapperRef}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-55%, -50%) perspective(1600px) rotateY(${BASE_ROTATE_Y}deg) rotateX(${BASE_ROTATE_X}deg)`,
          transformStyle: 'preserve-3d',
          width: '1100px',
          height: '1100px',
          willChange: 'transform',
        }}
      >
        {screens.map(({ id, src, alt, delay, top, left, width, height, rotate }) => (
          <motion.div
            key={id}
            initial={{ opacity: 0, y: 70, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.0, delay, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'absolute',
              top, left, width, height,
              transform: `rotate(${rotate})`,
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 24px 70px rgba(0,0,0,0.8), 0 0 0 1px rgba(0,240,255,0.18)',
            }}
            whileHover={{
              scale: 1.04,
              boxShadow: '0 32px 90px rgba(0,0,0,0.85), 0 0 0 2px rgba(0,240,255,0.5)',
              transition: { duration: 0.25 },
            }}
          >
            {/* Cyan edge glow */}
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
          </motion.div>
        ))}
      </div>

      {/* Ambient glow behind the group */}
      <div style={{
        position: 'absolute', top: '15%', left: '25%',
        width: '600px', height: '500px', pointerEvents: 'none',
        background: 'radial-gradient(ellipse, rgba(0,240,255,0.08) 0%, rgba(0,112,243,0.05) 50%, transparent 70%)',
        zIndex: 1,
      }} />

      {/* Left-edge fade so screens don't bleed into the text */}
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0, width: '140px',
        background: 'linear-gradient(to right, #0A0A0A 30%, transparent)',
        zIndex: 25, pointerEvents: 'none',
      }} />

      {/* Bottom fade */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '120px',
        background: 'linear-gradient(to top, #0A0A0A, transparent)',
        zIndex: 25, pointerEvents: 'none',
      }} />
    </div>
  );
}
