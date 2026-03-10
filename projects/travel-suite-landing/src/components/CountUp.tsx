'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView, useMotionValue, useSpring } from 'framer-motion';

interface CountUpProps {
  to: number;
  from?: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}

export function CountUp({ to, from = 0, duration = 2, suffix = '', prefix = '', className = '' }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const motionValue = useMotionValue(from);
  const springValue = useSpring(motionValue, { duration: duration * 1000 });
  const [displayValue, setDisplayValue] = useState(from);

  useEffect(() => {
    if (isInView) {
      motionValue.set(to);
    }
  }, [isInView, motionValue, to]);

  useEffect(() => {
    const unsubscribe = springValue.on('change', (latest) => {
      setDisplayValue(Math.round(latest));
    });
    return unsubscribe;
  }, [springValue]);

  return (
    <span ref={ref} className={className}>
      {prefix}{displayValue.toLocaleString()}{suffix}
    </span>
  );
}
