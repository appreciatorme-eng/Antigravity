'use client';
import { motion } from 'framer-motion';
import indiaMap from '@svg-maps/india';

// City positions mapped to the @svg-maps/india viewBox (0 0 612 696)
const cities = [
  { x: 189, y: 210, city: 'Delhi' },
  { x: 108, y: 410, city: 'Mumbai' },
  { x: 175, y: 530, city: 'Bangalore' },
  { x: 400, y: 285, city: 'Kolkata' },
  { x: 140, y: 440, city: 'Pune' },
  { x: 255, y: 525, city: 'Chennai' },
  { x: 145, y: 240, city: 'Jaipur' },
  { x: 235, y: 465, city: 'Hyderabad' },
  { x: 158, y: 600, city: 'Kochi' },
  { x: 92, y: 320, city: 'Ahmedabad' },
];

export function IndiaMap() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {/* Glow aura behind map */}
      <div 
        className="absolute w-[300px] h-[400px] rounded-full blur-[100px] opacity-[0.07]"
        style={{ background: 'radial-gradient(circle, #00F0FF, transparent)' }}
      />
      
      {/* India SVG using real geographic paths from @svg-maps/india */}
      <svg
        viewBox={indiaMap.viewBox}
        className="w-[340px] h-[420px] md:w-[400px] md:h-[490px]"
        fill="none"
      >
        <defs>
          <radialGradient id="indiaGradient" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#00F0FF" stopOpacity="0.02" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* All Indian state boundaries */}
        <motion.g
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
          viewport={{ once: true }}
        >
          {indiaMap.locations.map((location: { id: string; path: string; name: string }) => (
            <path
              key={location.id}
              d={location.path}
              fill="url(#indiaGradient)"
              stroke="#00F0FF"
              strokeWidth="0.5"
              strokeOpacity="0.35"
            />
          ))}
        </motion.g>

        {/* City dots on the map */}
        {cities.map(({ x, y, city }, i) => (
          <g key={city}>
            {/* Ping ring */}
            <motion.circle
              cx={x}
              cy={y}
              r="10"
              fill="none"
              stroke="#00F0FF"
              strokeWidth="0.5"
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: [0, 1.5, 1.5], opacity: [0, 0.4, 0] }}
              transition={{ delay: i * 0.3, duration: 2, repeat: Infinity, repeatDelay: 3 }}
              viewport={{ once: true }}
            />
            {/* Main dot */}
            <motion.circle
              cx={x}
              cy={y}
              r="4"
              fill="#00F0FF"
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.2, duration: 0.4 }}
              viewport={{ once: true }}
              filter="url(#glow)"
            />
            {/* City label */}
            <motion.text
              x={x + (x > 350 ? -10 : 10)}
              y={y + 5}
              fill="#9ca3af"
              fontSize="11"
              fontFamily="system-ui, sans-serif"
              fontWeight="500"
              textAnchor={x > 350 ? 'end' : 'start'}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: i * 0.2 + 0.3 }}
              viewport={{ once: true }}
            >
              {city}
            </motion.text>
          </g>
        ))}

        {/* Connection lines between nearby cities */}
        {[
          [0, 6], // Delhi-Jaipur
          [6, 9], // Jaipur-Ahmedabad
          [9, 1], // Ahmedabad-Mumbai
          [1, 4], // Mumbai-Pune
          [4, 7], // Pune-Hyderabad
          [7, 5], // Hyderabad-Chennai
          [5, 2], // Chennai-Bangalore
          [2, 8], // Bangalore-Kochi
          [3, 0], // Kolkata-Delhi
        ].map(([from, to], i) => (
          <motion.line
            key={`line-${i}`}
            x1={cities[from].x}
            y1={cities[from].y}
            x2={cities[to].x}
            y2={cities[to].y}
            stroke="#00F0FF"
            strokeWidth="0.4"
            strokeDasharray="4,4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 0.2 }}
            transition={{ delay: 1 + i * 0.15 }}
            viewport={{ once: true }}
          />
        ))}
      </svg>
    </div>
  );
}
