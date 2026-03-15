const sizeMap = {
  sm: { fontSize: 20, height: 24 },
  md: { fontSize: 28, height: 32 },
  lg: { fontSize: 36, height: 42 },
} as const;

type LogoSize = keyof typeof sizeMap;

interface TravelBuiltLogoProps {
  size?: LogoSize;
  className?: string;
}

export function TravelBuiltLogo({ size = "md", className = "" }: TravelBuiltLogoProps) {
  const { fontSize, height } = sizeMap[size];
  const gradientId = `travelbuilt-shimmer-${size}`;

  return (
    <svg
      height={height}
      viewBox={`0 0 ${fontSize * 7} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="TravelBuilt"
      role="img"
    >
      <defs>
        <linearGradient id={gradientId} x1="-100%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FF9933" />
          <stop offset="25%" stopColor="#A259FF" />
          <stop offset="50%" stopColor="#00F0FF" stopOpacity="1">
            <animate attributeName="stop-color" values="#00F0FF;#ffffff;#00F0FF" dur="4s" repeatCount="indefinite" />
          </stop>
          <stop offset="75%" stopColor="#A259FF" />
          <stop offset="100%" stopColor="#FF9933" />

          {/* Sweep the gradient continuously from left to right */}
          <animate
            attributeName="x1"
            values="-100%;100%"
            dur="4s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="x2"
            values="100%;300%"
            dur="4s"
            repeatCount="indefinite"
          />
        </linearGradient>
      </defs>
      <text
        x="0"
        y={height * 0.78}
        fill={`url(#${gradientId})`}
        fontFamily="inherit"
        fontWeight="900"
        fontSize={fontSize}
        letterSpacing="-0.02em"
      >
        TravelBuilt
      </text>
    </svg>
  );
}
