import Image from 'next/image';

const sizeMap = {
  sm: { width: 120, height: 32 },
  md: { width: 160, height: 42 },
  lg: { width: 200, height: 52 },
} as const;

type LogoSize = keyof typeof sizeMap;

interface TravelBuiltLogoProps {
  size?: LogoSize;
  className?: string;
}

export function TravelBuiltLogo({ size = "md", className = "" }: TravelBuiltLogoProps) {
  const { width, height } = sizeMap[size];

  return (
    <Image
      src="/marketing/travelbuilt-logo-premium.png"
      alt="TravelBuilt"
      width={width}
      height={height}
      priority
      className={className}
      style={{ objectFit: 'contain' }}
    />
  );
}
