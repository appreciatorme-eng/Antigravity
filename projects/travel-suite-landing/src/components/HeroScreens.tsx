'use client';

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

/**
 * Layout design: staggered 2-column grid with massive Z-depth separation.
 * Each screen has its own 3D rotateX + rotateY (individual tilt) in addition
 * to the parent scene rotation driven by the mouse. This stacks: parent tilt
 * + individual tilt = same compound 3D look Spline had.
 * 
 * Z range: -100px → +220px (320px total) with 900px perspective = very dramatic.
 */
const screens = [
  {
    id: 1,
    src: '/dashboard_ui_mockup_1773059467134.png',
    alt: 'Dashboard',
    delay: 0.08,
    // Position in wrapper
    top: '-80px', left: '-40px',
    width: 820, height: 492,
    // Individual 3D tilt — stacks on top of parent scene rotation
    rx: '4deg', ry: '8deg', rz: '-3deg',
    // Real Z position — key to depth parallax
    z: '80px',
  },
  {
    id: 2,
    src: '/analytics_ui_mockup_1773062281103.png',
    alt: 'Analytics',
    delay: 0.18,
    top: '10px', left: '610px',
    width: 590, height: 354,
    rx: '-3deg', ry: '-10deg', rz: '4deg',
    z: '-40px',
  },
  {
    id: 3,
    src: '/crm_ui_mockup_1773059519930.png',
    alt: 'CRM',
    delay: 0.12,
    top: '380px', left: '-60px',
    width: 860, height: 516,
    rx: '2deg', ry: '6deg', rz: '-1deg',
    z: '220px', // most in front — moves the most with mouse
  },
  {
    id: 4,
    src: '/booking_ui_mockup_1773059498138.png',
    alt: 'Bookings',
    delay: 0.22,
    top: '390px', left: '600px',
    width: 590, height: 354,
    rx: '-4deg', ry: '-8deg', rz: '3.5deg',
    z: '60px',
  },
  {
    id: 5,
    src: '/itinerary_ui_mockup_1773062264651.png',
    alt: 'Itinerary',
    delay: 0.28,
    top: '860px', left: '-20px',
    width: 700, height: 420,
    rx: '3deg', ry: '5deg', rz: '-2deg',
    z: '120px',
  },
  {
    id: 6,
    src: '/invoicing_ui_mockup_1773062297390.png',
    alt: 'Invoicing',
    delay: 0.34,
    top: '870px', left: '550px',
    width: 540, height: 324,
    rx: '-2deg', ry: '-6deg', rz: '2.5deg',
    z: '-60px', // most behind — moves least = real parallax depth
  },
];

// ─── Scene rotation config ───────────────────────────────────────────────────
const BASE_RX =  8;   // base upward tilt (like Spline's camera angle looking slightly down)
const BASE_RY = -20;  // base leftward tilt (Spline's resting angle)
const MAX_RY  =  36;  // total yaw range — very dramatic left-to-right
const MAX_RX  =  22;  // total pitch range — dramatic up-down
const LERP    =  0.095; // smooth but responsive
// ────────────────────────────────────────────────────────────────────────────

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
        // Short perspective (900px) = very dramatic foreshortening — same as Spline's FOV
        wrapperRef.current.style.transform =
          `translate(-52%, -50%) perspective(900px) rotateX(${curr.current.rx}deg) rotateY(${curr.current.ry}deg)`;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    const onMove = (e: MouseEvent) => {
      const nx = e.clientX / window.innerWidth  - 0.5;
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
      width: '60%', height: '100%',
      overflow: 'visible', zIndex: 10, pointerEvents: 'none',
    }}>

      <div
        ref={wrapperRef}
        style={{
          position: 'absolute',
          top: '50%', left: '50%',
          // Initial resting transform — gets overwritten by rAF loop immediately
          transform: `translate(-52%, -50%) perspective(900px) rotateX(${BASE_RX}deg) rotateY(${BASE_RY}deg)`,
          // preserve-3d is ESSENTIAL — makes children's translateZ real 3D positions
          transformStyle: 'preserve-3d',
          width: '1300px',
          height: '1350px',
          willChange: 'transform',
        }}
      >
        {screens.map(({ id, src, alt, delay, top, left, width, height, rx, ry, rz, z }) => (
          <motion.div
            key={id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'absolute',
              top, left, width, height,
              /**
               * COMPOUND 3D TRANSFORM on each screen:
               * 1. rotateX/Y — individual tilt gives each screen its own angle
               * 2. rotateZ — slight 2D slant for variety  
               * 3. translateZ — the DEPTH position (most important for parallax)
               * 
               * When the parent scene rotates, screens at high translateZ
               * appear to "come forward" dramatically — exactly Spline's depth.
               */
              transform: `rotateX(${rx}) rotateY(${ry}) rotateZ(${rz}) translateZ(${z})`,
              borderRadius: '14px',
              overflow: 'hidden',
              boxShadow: '0 30px 90px rgba(0,0,0,0.85), 0 0 0 1px rgba(0,240,255,0.2)',
              pointerEvents: 'auto',
              cursor: 'default',
            }}
            whileHover={{
              scale: 1.035,
              transition: { duration: 0.3 },
            }}
          >
            {/* Screen edge glow */}
            <div style={{
              position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
              borderRadius: '14px',
              boxShadow: 'inset 0 0 0 1.5px rgba(0,240,255,0.25)',
              background: 'linear-gradient(135deg, rgba(0,240,255,0.04) 0%, transparent 50%)',
            }} />
            {/* Screen reflection sheen */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '40%',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 100%)',
              zIndex: 2, pointerEvents: 'none', borderRadius: '14px 14px 0 0',
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

      {/* Atmospheric depth glow */}
      <div style={{
        position: 'absolute', top: '10%', left: '15%',
        width: '700px', height: '600px', pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 40% 40%, rgba(0,240,255,0.1) 0%, rgba(0,112,243,0.06) 40%, transparent 70%)',
        zIndex: 1,
      }} />

      {/* Left fade — clean boundary with hero text */}
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0, width: '160px',
        background: 'linear-gradient(to right, #0A0A0A 40%, transparent)',
        zIndex: 35, pointerEvents: 'none',
      }} />

      {/* Bottom fade */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '140px',
        background: 'linear-gradient(to top, #0A0A0A, transparent)',
        zIndex: 35, pointerEvents: 'none',
      }} />
    </div>
  );
}
