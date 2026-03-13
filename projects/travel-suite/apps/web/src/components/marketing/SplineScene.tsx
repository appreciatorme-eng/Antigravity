"use client";

import dynamic from "next/dynamic";

const Spline = dynamic(() => import("@splinetool/react-spline"), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#0A0A0A]">
      <div className="w-8 h-8 rounded-full border-t-2 border-[#00F0FF] animate-spin" />
    </div>
  )
});

interface SplineSceneProps {
  sceneUrl: string;
  className?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Spline app instance type is not exported from @splinetool/react-spline
  onLoad?: (splineApp: any) => void;
}

export function SplineScene({ sceneUrl, className = "", onLoad }: SplineSceneProps) {
  return (
    <div className={`w-full h-full ${className}`}>
      <Spline scene={sceneUrl} onLoad={onLoad} />
    </div>
  );
}
