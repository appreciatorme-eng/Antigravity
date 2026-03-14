"use client";

import { Suspense, lazy } from "react";

const Spline = lazy(() => import("@splinetool/react-spline"));

function SplineFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#0A0A0A]">
      <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-[#00F0FF]" />
    </div>
  );
}

interface SplineSceneProps {
  sceneUrl: string;
  className?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Spline app instance type is not exported from @splinetool/react-spline
  onLoad?: (splineApp: any) => void;
}

export function SplineScene({ sceneUrl, className = "", onLoad }: SplineSceneProps) {
  return (
    <div className={`w-full h-full ${className}`}>
      <Suspense fallback={<SplineFallback />}>
        <Spline scene={sceneUrl} onLoad={onLoad} />
      </Suspense>
    </div>
  );
}
