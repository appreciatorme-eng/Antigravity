'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { SplineScene } from '@/components/marketing/SplineScene';
import type { Application } from '@splinetool/runtime';

/**
 * Static placeholder screens — arranged in a 2×3 grid layout
 * that visually matches Spline's desk arrangement.
 * Each screen is positioned as % of the container so they stay in view.
 */
const screens = [
  // Row 1: two screens at top — positioned right of center for full-width container
  { src: '/marketing/dashboard_ui_mockup_1773059467134.png', alt: 'Dashboard',  top: '4%',  left: '32%', w: 38, h: 22, rz: -2,  delay: 0.05 },
  { src: '/marketing/analytics_ui_mockup_1773062281103.png', alt: 'Analytics',  top: '2%',  left: '62%', w: 30, h: 18, rz: 2.5, delay: 0.15 },
  // Row 2: two screens in middle (largest)
  { src: '/marketing/crm_ui_mockup_1773059519930.png',       alt: 'CRM',        top: '33%', left: '30%', w: 40, h: 24, rz: -1,  delay: 0.1 },
  { src: '/marketing/booking_ui_mockup_1773059498138.png',   alt: 'Bookings',   top: '34%', left: '60%', w: 32, h: 20, rz: 2,   delay: 0.2 },
  // Row 3: two screens at bottom
  { src: '/marketing/itinerary_ui_mockup_1773062264651.png', alt: 'Itinerary',  top: '65%', left: '34%', w: 35, h: 20, rz: -1.5,delay: 0.25 },
  { src: '/marketing/invoicing_ui_mockup_1773062297390.png', alt: 'Invoicing',  top: '66%', left: '60%', w: 28, h: 17, rz: 1.5, delay: 0.3 },
];

interface HeroScreensProps {
  onSplineReady?: () => void;
}

export function HeroScreens({ onSplineReady }: HeroScreensProps) {
  const [splineLoaded, setSplineLoaded] = useState(false);

  const mockups = [
    '/marketing/dashboard_ui_mockup_1773059467134.png',
    '/marketing/booking_ui_mockup_1773059498138.png',
    '/marketing/crm_ui_mockup_1773059519930.png',
    '/marketing/itinerary_ui_mockup_1773062264651.png',
    '/marketing/analytics_ui_mockup_1773062281103.png',
    '/marketing/invoicing_ui_mockup_1773062297390.png',
  ];

  const onSplineLoad = async (splineApp: Application) => {
    // 1. Hide unwanted Spline text/logos
    const targetsToHide = [
      'PROJECT NAME', 'PROMO', 'your logo+text',
      'P', 'E', 'A', 'R', 'L', 'PEARL',
    ];
    targetsToHide.forEach(name => {
      const obj = splineApp.findObjectByName(name) as ({ text?: string; visible?: boolean } | undefined);
      if (obj && typeof obj.text !== 'undefined') obj.text = '';
      if (obj) obj.visible = false;
    });

    // 2. Inject custom textures
    await new Promise(r => setTimeout(r, 1500));

    const promises: Promise<void>[] = [];
    for (let i = 1; i <= 6; i++) {
      const panel = splineApp.findObjectByName(`1700x950 ${i}`);
      if (panel?.material?.layers) {
        panel.material.layers.forEach((layer) => {
          const textureLayer = layer as { type?: string; updateTexture?: (url: string) => Promise<void> };
          if ((textureLayer.type === 'texture' || textureLayer.type === 'matcap') && textureLayer.updateTexture) {
            promises.push(textureLayer.updateTexture(window.location.origin + mockups[i - 1]));
          }
        });
      }
    }

    try { await Promise.all(promises); } catch (e) { console.warn('Some textures failed', e); }

    // 3. Wait for GPU to actually paint new textures
    await new Promise<void>(resolve =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    );

    // 4. Crossfade to Spline
    setSplineLoaded(true);
    onSplineReady?.();
  };

  return (
    <div style={{
      position: 'absolute', inset: 0,
      overflow: 'visible', zIndex: 10,
    }}>

      {/* ─── LAYER 1: Static CSS placeholder — INSTANT ─── */}
      <div
        style={{
          position: 'absolute',
          top: '5%', left: '0', right: '0', bottom: '5%',
          opacity: splineLoaded ? 0 : 1,
          transition: 'opacity 1.2s ease-in-out',
          pointerEvents: splineLoaded ? 'none' : 'auto',
          perspective: '1400px',
          perspectiveOrigin: '40% 50%',  // shifted left so 3D tilt doesn't push right
          zIndex: 2,
        }}
      >
        <div style={{
          position: 'absolute', inset: 0,
          transform: 'rotateX(5deg) rotateY(-12deg)',
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
                transform: `rotateZ(${rz}deg) translateZ(${(3 - i) * 25}px)`,
                borderRadius: '12px', overflow: 'hidden',
                boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(0,240,255,0.18)',
              }}
            >
              {/* Reflection sheen */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '35%',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 100%)',
                zIndex: 2, pointerEvents: 'none', borderRadius: '12px 12px 0 0',
              }} />
              <Image
                src={src} alt={alt}
                fill
                sizes={`${w}vw`}
                priority
                className="object-cover"
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* ─── LAYER 2: Spline 3D — full viewport coverage, crossfades in ─── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
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
        position: 'absolute', top: 0, left: 0, bottom: 0, width: '100px',
        background: 'linear-gradient(to right, #0A0A0A 20%, transparent)',
        zIndex: 15, pointerEvents: 'none',
      }} />

      {/* Bottom fade */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '120px',
        background: 'linear-gradient(to top, #0A0A0A, transparent)',
        zIndex: 15, pointerEvents: 'none',
      }} />
    </div>
  );
}
