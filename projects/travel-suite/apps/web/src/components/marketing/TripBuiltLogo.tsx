import { motion } from 'framer-motion';

const sizeMap = {
  sm: { text: "text-2xl", height: 32 },
  md: { text: "text-[28px]", height: 42 },
  lg: { text: "text-4xl", height: 52 },
} as const;

type LogoSize = keyof typeof sizeMap;

interface TripBuiltLogoProps {
  size?: LogoSize;
  className?: string;
}

export function TripBuiltLogo({ size = "md", className = "" }: TripBuiltLogoProps) {
  const { text, height } = sizeMap[size];

  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ height }}>
      {/* Dynamic Animated Flight Path / Swoosh blending with the navbar */}
      <svg
        className="absolute w-[150%] h-[200%] -left-[20%] -top-[50%] pointer-events-none opacity-90"
        viewBox="0 0 200 100"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={`glow-${size}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#A259FF" stopOpacity="0" />
            <stop offset="30%" stopColor="#A259FF" stopOpacity="0.8" />
            <stop offset="70%" stopColor="#00F0FF" stopOpacity="1" />
            <stop offset="100%" stopColor="#00F0FF" stopOpacity="0" />
          </linearGradient>
          <filter id={`blur-${size}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>
        
        {/* Glow behind the path */}
        <motion.path
          d="M 10 70 Q 50 20 100 50 T 190 30"
          fill="transparent"
          stroke={`url(#glow-${size})`}
          strokeWidth="6"
          filter={`url(#blur-${size})`}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.6 }}
          transition={{ duration: 3, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
        />
        
        {/* Crisp core path */}
        <motion.path
          d="M 10 70 Q 50 20 100 50 T 190 30"
          fill="transparent"
          stroke={`url(#glow-${size})`}
          strokeWidth="1.5"
          initial={{ pathLength: 0, pathOffset: 1 }}
          animate={{ pathLength: 1, pathOffset: 0 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Animated dot following the path */}
        <motion.circle
          r="2.5"
          fill="#FFF"
          style={{ filter: "drop-shadow(0 0 4px #00F0FF)" }}
        >
          <animateMotion
            dur="3s"
            repeatCount="indefinite"
            path="M 10 70 Q 50 20 100 50 T 190 30"
          />
        </motion.circle>
      </svg>

      <div className="relative z-10 font-black tracking-tighter flex items-center pr-2">
        <span className={`bg-clip-text text-transparent bg-gradient-to-br from-white via-gray-100 to-gray-400 ${text} drop-shadow-sm`}>
          Trip
        </span>
        <span className={`bg-clip-text text-transparent bg-gradient-to-r from-[#FF9933] via-[#A259FF] to-[#00F0FF] ${text} animate-gradient-x`}>
          Built
        </span>
      </div>
    </div>
  );
}
