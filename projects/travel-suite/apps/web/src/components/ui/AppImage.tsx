"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useMemo, useState, type CSSProperties } from "react";

type DimensionValue = CSSProperties["width"] | CSSProperties["height"];

function toPixels(value: DimensionValue, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.endsWith("px")) {
      const parsed = Number.parseFloat(trimmed.slice(0, -2));
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return fallback;
}

function shouldUseFill(style?: CSSProperties, fill?: boolean) {
  if (typeof fill === "boolean") return fill;
  if (!style) return false;

  return (
    style.position === "absolute" ||
    style.inset !== undefined ||
    style.width === "100%" ||
    style.height === "100%" ||
    style.top !== undefined ||
    style.left !== undefined ||
    style.right !== undefined ||
    style.bottom !== undefined
  );
}

type AppImageProps = Omit<ImageProps, "width" | "height" | "fill" | "src" | "alt"> & {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
  width?: number;
  height?: number;
  fill?: boolean;
  fallbackSrc?: string;
};

export function AppImage({
  src,
  alt,
  className,
  style,
  width,
  height,
  fill,
  fallbackSrc,
  sizes,
  priority,
  unoptimized = true,
  ...rest
}: AppImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);

  useEffect(() => {
    setCurrentSrc(src);
  }, [src]);

  const useFill = shouldUseFill(style, fill);
  const autoHeight = style?.height === "auto";
  const resolvedWidth = width ?? toPixels(style?.width, 1200);
  const resolvedHeight = height ?? (autoHeight ? Math.max(1, Math.round(resolvedWidth / 2)) : toPixels(style?.height, 675));

  const imageStyle = useMemo<CSSProperties>(
    () => ({
      objectFit: style?.objectFit,
      filter: style?.filter,
      opacity: style?.opacity,
      borderRadius: style?.borderRadius,
      objectPosition: style?.objectPosition,
      transform: style?.transform,
      width: useFill ? undefined : "100%",
      height: useFill ? undefined : autoHeight ? "auto" : "100%",
    }),
    [autoHeight, style, useFill],
  );

  const wrapperStyle = useMemo<CSSProperties>(() => {
    if (useFill) {
      return {
        position: style?.position === "absolute" ? "absolute" : "relative",
        inset: style?.inset,
        top: style?.top,
        left: style?.left,
        right: style?.right,
        bottom: style?.bottom,
        width: style?.width ?? "100%",
        height: style?.height ?? "100%",
        overflow: "hidden",
        display: "block",
        borderRadius: style?.borderRadius,
        marginBottom: style?.marginBottom,
        opacity: style?.opacity,
      };
    }

      return {
        width: style?.width ?? resolvedWidth,
        height: autoHeight ? "auto" : style?.height ?? resolvedHeight,
        display: "block",
        overflow: "hidden",
        borderRadius: style?.borderRadius,
      marginBottom: style?.marginBottom,
      opacity: style?.opacity,
    };
  }, [autoHeight, resolvedHeight, resolvedWidth, style, useFill]);

  return (
    <span className={className} style={wrapperStyle}>
      <Image
        {...rest}
        alt={alt}
        fill={useFill}
        height={useFill ? undefined : resolvedHeight}
        priority={priority}
        sizes={sizes ?? (useFill ? "100vw" : `${resolvedWidth}px`)}
        src={currentSrc}
        style={imageStyle}
        unoptimized={unoptimized}
        width={useFill ? undefined : resolvedWidth}
        onError={() => {
          if (fallbackSrc && currentSrc !== fallbackSrc) {
            setCurrentSrc(fallbackSrc);
          }
        }}
      />
    </span>
  );
}
