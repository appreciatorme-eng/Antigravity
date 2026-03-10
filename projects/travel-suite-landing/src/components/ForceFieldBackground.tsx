'use client';
import React, { useEffect, useState, useCallback } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { Container, Engine } from '@tsparticles/engine';

export function ForceFieldBackground({ id = 'tsparticles-forcefield', particleCount = 280 }: { id?: string; particleCount?: number }) {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine: Engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const particlesLoaded = useCallback(async (container?: Container) => {
    // Container is ready
  }, []);

  if (!init) return null;

  return (
    <div className="absolute inset-0 -z-10 pointer-events-none">
      <Particles
        id={id}
        particlesLoaded={particlesLoaded}
        options={{
          fullScreen: { enable: false },
          background: { color: { value: 'transparent' } },
          fpsLimit: 60,
          interactivity: {
            events: {
              onHover: {
                enable: true,
                mode: 'repulse',
              },
            },
            modes: {
              repulse: {
                distance: 180,
                duration: 0.4,
                factor: 100,
                speed: 1,
                maxSpeed: 50,
              },
            },
          },
          particles: {
            color: { value: '#00F0FF' },
            links: {
              color: '#00F0FF',
              distance: 140,
              enable: true,
              opacity: 0.35,
              width: 1,
            },
            move: {
              enable: true,
              speed: 0.8,
              direction: 'none',
              outModes: { default: 'out' },
            },
            number: {
              density: { enable: true },
              value: particleCount,
            },
            opacity: { value: 0.85 },
            shape: { type: 'circle' },
            size: { value: { min: 1, max: 3 } },
          },
          detectRetina: true,
        }}
      />
    </div>
  );
}
