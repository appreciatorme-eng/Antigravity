"use client";

import { Suspense, lazy } from "react";
import type { Application } from "@splinetool/runtime";

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
  onLoad?: (splineApp: Application) => void;
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
