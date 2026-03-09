'use client';

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

const screens = [
  {
    id: 1,
    src: '/dashboard_ui_mockup_1773059467134.png',
    alt: 'TravelSuite Dashboard',
    style: {
      width: 520,
      height: 310,
      top: '-5%',
      right: '18%',
      zIndex: 4,
      transform: 'perspective(1200px) rotateY(-18deg) rotateX(6deg) rotateZ(-1deg)',
    },
    delay: 0.1,
  },
  {
    id: 2,
    src: '/analytics_ui_mockup_1773062281103.png',
    alt: 'TravelSuite Analytics',
    style: {
      width: 420,
      height: 250,
      top: '2%',
      right: '-2%',
      zIndex: 3,
      transform: 'perspective(1200px) rotateY(-22deg) rotateX(4deg) rotateZ(1deg)',
    },
    delay: 0.2,
  },
  {
    id: 3,
    src: '/crm_ui_mockup_1773059519930.png',
    alt: 'TravelSuite CRM',
    style: {
      width: 560,
      height: 340,
      top: '28%',
      right: '10%',
      zIndex: 6,
      transform: 'perspective(1200px) rotateY(-14deg) rotateX(3deg) rotateZ(-0.5deg)',
    },
    delay: 0.15,
  },
  {
    id: 4,
    src: '/booking_ui_mockup_1773059498138.png',
    alt: 'TravelSuite Bookings',
    style: {
      width: 400,
      height: 240,
      top: '30%',
      right: '-4%',
      zIndex: 5,
      transform: 'perspective(1200px) rotateY(-24deg) rotateX(2deg) rotateZ(1.5deg)',
    },
    delay: 0.25,
  },
  {
    id: 5,
    src: '/itinerary_ui_mockup_1773062264651.png',
    alt: 'TravelSuite Itinerary',
    style: {
      width: 450,
      height: 270,
      top: '60%',
      right: '20%',
      zIndex: 4,
      transform: 'perspective(1200px) rotateY(-16deg) rotateX(2deg) rotateZ(-1deg)',
    },
    delay: 0.3,
  },
  {
    id: 6,
    src: '/invoicing_ui_mockup_1773062297390.png',
    alt: 'TravelSuite Invoicing',
    style: {
      width: 380,
      height: 230,
      top: '63%',
      right: '-2%',
      zIndex: 3,
      transform: 'perspective(1200px) rotateY(-26deg) rotateX(1deg) rotateZ(2deg)',
    },
    delay: 0.35,
  },
];

export function HeroScreens() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse parallax effect
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY, currentTarget } = e;
      const target = currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      const x = (clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
      const y = (clientY - rect.top) / rect.height - 0.5;

      const cards = container.querySelectorAll<HTMLElement>('.screen-card');
      cards.forEach((card, i) => {
        const depth = (i % 3) + 1; // 1, 2, or 3
        const moveX = x * depth * 14;
        const moveY = y * depth * 8;
        card.style.transform = card.dataset.baseTransform
          ? `${card.dataset.baseTransform} translateX(${moveX}px) translateY(${moveY}px)`
          : '';
      });
    };

    const handleMouseLeave = () => {
      const cards = container.querySelectorAll<HTMLElement>('.screen-card');
      cards.forEach(card => {
        card.style.transform = card.dataset.baseTransform || '';
        card.style.transition = 'transform 0.8s ease-out';
      });
    };

    const parent = container.parentElement;
    parent?.addEventListener('mousemove', handleMouseMove);
    parent?.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      parent?.removeEventListener('mousemove', handleMouseMove);
      parent?.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {screens.map(({ id, src, alt, style, delay }) => (
        <motion.div
          key={id}
          className="screen-card"
          data-base-transform={style.transform}
          initial={{ opacity: 0, y: 60, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 1.0,
            delay,
            ease: [0.22, 1, 0.36, 1],
          }}
          style={{
            position: 'absolute',
            top: style.top,
            right: style.right,
            width: style.width,
            height: style.height,
            zIndex: style.zIndex,
            transform: style.transform,
            willChange: 'transform',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,240,255,0.12)',
            pointerEvents: 'auto',
          }}
          whileHover={{ scale: 1.03, transition: { duration: 0.3 } }}
        >
          {/* Subtle cyan edge glow */}
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '12px',
            boxShadow: 'inset 0 0 0 1px rgba(0,240,255,0.2)',
            zIndex: 2,
            pointerEvents: 'none',
          }} />

          <Image
            src={src}
            alt={alt}
            width={style.width * 2}
            height={style.height * 2}
            priority={id <= 3}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        </motion.div>
      ))}

      {/* Atmospheric glow behind the screens */}
      <div style={{
        position: 'absolute',
        right: '10%',
        top: '20%',
        width: '600px',
        height: '500px',
        background: 'radial-gradient(ellipse, rgba(0,240,255,0.06) 0%, rgba(0,112,243,0.04) 50%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 1,
      }} />
    </div>
  );
}
