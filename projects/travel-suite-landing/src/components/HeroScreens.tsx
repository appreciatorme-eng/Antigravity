'use client';

import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { SplineScene } from '@/components/SplineScene';

/**
 * Static placeholder screens — shown INSTANTLY on page load.
 * Once Spline loads and textures are injected, we crossfade to Spline.
 */
const screens = [
  { src: '/dashboard_ui_mockup_1773059467134.png', alt: 'Dashboard', top: '2%', left: '0%', w: 46, h: 28, rz: -2, delay: 0.05 },
  { src: '/analytics_ui_mockup_1773062281103.png', alt: 'Analytics', top: '0%', left: '42%', w: 36, h: 22, rz: 3, delay: 0.15 },
  { src: '/crm_ui_mockup_1773059519930.png', alt: 'CRM', top: '32%', left: '-3%', w: 50, h: 30, rz: -1, delay: 0.1 },
  { src: '/booking_ui_mockup_1773059498138.png', alt: 'Bookings', top: '34%', left: '40%', w: 38, h: 23, rz: 2.5, delay: 0.2 },
  { src: '/itinerary_ui_mockup_1773062264651.png', alt: 'Itinerary', top: '64%', left: '2%', w: 42, h: 26, rz: -1.5, delay: 0.25 },
  { src: '/invoicing_ui_mockup_1773062297390.png', alt: 'Invoicing', top: '66%', left: '38%', w: 34, h: 21, rz: 2, delay: 0.3 },
];

interface HeroScreensProps {
  onSplineReady?: () => void;
}

export function HeroScreens({ onSplineReady }: HeroScreensProps) {
  const [splineLoaded, setSplineLoaded] = useState(false);

  const mockups = [
    '/dashboard_ui_mockup_1773059467134.png',
    '/booking_ui_mockup_1773059498138.png',
    '/crm_ui_mockup_1773059519930.png',
    '/itinerary_ui_mockup_1773062264651.png',
    '/analytics_ui_mockup_1773062281103.png',
    '/invoicing_ui_mockup_1773062297390.png',
  ];

  const onSplineLoad = async (splineApp: any) => {
    // 1. Hide unwanted Spline text/logos
    const targetsToHide = [
      'PROJECT NAME', 'PROMO', 'your logo+text',
      'P', 'E', 'A', 'R', 'L', 'PEARL',
    ];
    targetsToHide.forEach(name => {
      const obj = splineApp.findObjectByName(name);
      if (obj && typeof obj.text !== 'undefined') obj.text = '';
      if (obj) obj.visible = false;
    });

    // 2. Inject our custom mockup textures
    await new Promise(r => setTimeout(r, 1500));

    const promises: Promise<void>[] = [];
    for (let i = 1; i <= 6; i++) {
      const panel = splineApp.findObjectByName(`1700x950 ${i}`);
      if (panel?.material?.layers) {
        panel.material.layers.forEach((layer: any) => {
          if (layer.type === 'texture' || layer.type === 'matcap') {
            promises.push(layer.updateTexture(window.location.origin + mockups[i - 1]));
          }
        });
      }
    }

    try { await Promise.all(promises); } catch (e) { console.warn('Some textures failed', e); }

    // 3. Wait for GPU to paint
    await new Promise<void>(resolve =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    );

    // 4. Reveal Spline (CSS will crossfade out the placeholder)
    setSplineLoaded(true);
    onSplineReady?.();
  };

  return (
    <div style={{
      position: 'absolute', top: 0, right: 0,
      width: '60%', height: '100%',
      overflow: 'visible', zIndex: 10,
    }}>

      {/* ─── LAYER 1: Static CSS placeholder — INSTANT DISPLAY ─── */}
      <div
        style={{
          position: 'absolute', inset: 0,
          opacity: splineLoaded ? 0 : 1,
          transition: 'opacity 1.2s ease-in-out',
          pointerEvents: splineLoaded ? 'none' : 'auto',
          // Subtle CSS 3D for the placeholder
          perspective: '1200px',
          perspectiveOrigin: '50% 50%',
          zIndex: 2,
        }}
      >
        <div style={{
          position: 'absolute', inset: 0,
          transform: 'rotateX(6deg) rotateY(-14deg)',
          transformStyle: 'preserve-3d',
        }}>
          {screens.map(({ src, alt, top, left, w, h, rz, delay }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
              style={{
                position: 'absolute', top, left,
                width: `${w}%`, height: `${h}%`,
                transform: `rotateZ(${rz}deg) translateZ(${(3 - i) * 30}px)`,
                borderRadius: '12px', overflow: 'hidden',
                boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(0,240,255,0.18)',
              }}
            >
              <Image
                src={src} alt={alt}
                width={1400} height={840}
                priority
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* ─── LAYER 2: Spline 3D — loads in background, crossfades in ─── */}
      <div
        style={{
          position: 'absolute',
          inset: '-10% -10% -10% -5%', // slightly oversized to cover edges during rotation
          opacity: splineLoaded ? 0.92 : 0,
          transition: 'opacity 1.5s ease-in-out',
          pointerEvents: splineLoaded ? 'auto' : 'none',
          zIndex: 3,
        }}
      >
        <SplineScene
          sceneUrl="https://prod.spline.design/FOAdqNVCO1g5ncBd/scene.splinecode"
          onLoad={onSplineLoad}
        />
      </div>

      {/* Left-edge gradient fade */}
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0, width: '120px',
        background: 'linear-gradient(to right, #0A0A0A 25%, transparent)',
        zIndex: 10, pointerEvents: 'none',
      }} />

      {/* Bottom fade */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '120px',
        background: 'linear-gradient(to top, #0A0A0A, transparent)',
        zIndex: 10, pointerEvents: 'none',
      }} />
    </div>
  );
}
