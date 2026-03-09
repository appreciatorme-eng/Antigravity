'use client';

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

// Z-depth gives genuine 3D separation when the scene rotates — exactly like Spline
const screens = [
  {
    id: 1, src: '/dashboard_ui_mockup_1773059467134.png', alt: 'Dashboard',
    delay: 0.1,
    top: '-60px', left: '-20px', width: 730, height: 438,
    rotateZ: '-2deg', translateZ: '80px',
  },
  {
    id: 2, src: '/analytics_ui_mockup_1773062281103.png', alt: 'Analytics',
    delay: 0.2,
    top: '-30px', left: '510px', width: 550, height: 330,
    rotateZ: '2.5deg', translateZ: '0px',
  },
  {
    id: 3, src: '/crm_ui_mockup_1773059519930.png', alt: 'CRM',
    delay: 0.15,
    top: '320px', left: '-40px', width: 800, height: 480,
    rotateZ: '-1deg', translateZ: '140px', // front-most = most dramatic movement
  },
  {
    id: 4, src: '/booking_ui_mockup_1773059498138.png', alt: 'Bookings',
    delay: 0.25,
    top: '340px', left: '560px', width: 540, height: 324,
    rotateZ: '3deg', translateZ: '40px',
  },
  {
    id: 5, src: '/itinerary_ui_mockup_1773062264651.png', alt: 'Itinerary',
    delay: 0.3,
    top: '740px', left: '40px', width: 630, height: 378,
    rotateZ: '-1.5deg', translateZ: '60px',
  },
  {
    id: 6, src: '/invoicing_ui_mockup_1773062297390.png', alt: 'Invoicing',
    delay: 0.35,
    top: '750px', left: '500px', width: 500, height: 300,
    rotateZ: '2deg', translateZ: '-20px', // slightly behind = less movement
  },
];

// ── Tuning knobs ──────────────────────────────────────────────
const BASE_RY   = -14;   // resting left-tilt (degrees)
const BASE_RX   =   5;   // resting up-tilt (degrees)
const MAX_RY    =  28;   // total swing left↔right (degrees)
const MAX_RX    =  16;   // total swing up↔down (degrees)
const LERP      =  0.10; // responsiveness (higher = snappier)
// ─────────────────────────────────────────────────────────────

export function HeroScreens() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const rafRef     = useRef<number>(0);
  const target     = useRef({ rx: BASE_RX, ry: BASE_RY });
  const curr       = useRef({ rx: BASE_RX, ry: BASE_RY });

  useEffect(() => {
    const loop = () => {
      curr.current.rx += (target.current.rx - curr.current.rx) * LERP;
      curr.current.ry += (target.current.ry - curr.current.ry) * LERP;

      if (wrapperRef.current) {
        wrapperRef.current.style.transform =
          `translate(-55%, -50%) perspective(1200px) rotateX(${curr.current.rx}deg) rotateY(${curr.current.ry}deg)`;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    const onMove = (e: MouseEvent) => {
      const nx = e.clientX / window.innerWidth  - 0.5; // -0.5 → +0.5
      const ny = e.clientY / window.innerHeight - 0.5;
      target.current.ry = BASE_RY + nx * MAX_RY;
      target.current.rx = BASE_RX - ny * MAX_RX;
    };

    const onLeave = () => {
      target.current.rx = BASE_RX;
      target.current.ry = BASE_RY;
    };

    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <div style={{
      position: 'absolute', top: 0, right: 0,
      width: '58%', height: '100%',
      overflow: 'visible', zIndex: 10, pointerEvents: 'none',
    }}>

      {/* 
        ┌─ THIS is the secret to Spline's depth effect ────────────────┐
        │  transformStyle: preserve-3d means children's translateZ     │
        │  values are REAL z-positions in 3D space. When we rotateY    │
        │  on this parent, screens at translateZ(140px) visually move  │
        │  much more than screens at translateZ(-20px) — exactly the   │
        │  parallax depth Spline's WebGL renderer was producing.       │
        └───────────────────────────────────────────────────────────── ┘
      */}
      <div
        ref={wrapperRef}
        style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: `translate(-55%, -50%) perspective(1200px) rotateX(${BASE_RX}deg) rotateY(${BASE_RY}deg)`,
          transformStyle: 'preserve-3d',
          width: '1100px', height: '1100px',
          willChange: 'transform',
        }}
      >
        {screens.map(({ id, src, alt, delay, top, left, width, height, rotateZ, translateZ }) => (
          <motion.div
            key={id}
            initial={{ opacity: 0, y: 80, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.1, delay, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'absolute', top, left, width, height,
              // rotateZ for slight 2D tilt within the plane
              // translateZ is the KEY — real 3D depth position
              transform: `rotateZ(${rotateZ}) translateZ(${translateZ})`,
              borderRadius: '12px', overflow: 'hidden',
              boxShadow: '0 28px 80px rgba(0,0,0,0.82), 0 0 0 1px rgba(0,240,255,0.2)',
              pointerEvents: 'auto',
            }}
            whileHover={{
              scale: 1.04,
              transition: { duration: 0.25 },
            }}
          >
            <div style={{
              position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
              borderRadius: '12px',
              boxShadow: 'inset 0 0 0 1px rgba(0,240,255,0.22)',
            }} />
            <Image
              src={src} alt={alt}
              width={width * 2} height={height * 2}
              priority={id <= 4}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </motion.div>
        ))}
      </div>

      {/* Atmospheric glow */}
      <div style={{
        position: 'absolute', top: '15%', left: '20%',
        width: '640px', height: '520px', pointerEvents: 'none',
        background: 'radial-gradient(ellipse, rgba(0,240,255,0.09) 0%, rgba(0,112,243,0.06) 45%, transparent 70%)',
        zIndex: 1,
      }} />

      {/* Left fade — prevents screens bleeding into hero text */}
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0, width: '150px',
        background: 'linear-gradient(to right, #0A0A0A 35%, transparent)',
        zIndex: 30, pointerEvents: 'none',
      }} />

      {/* Bottom fade */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '130px',
        background: 'linear-gradient(to top, #0A0A0A, transparent)',
        zIndex: 30, pointerEvents: 'none',
      }} />
    </div>
  );
}
