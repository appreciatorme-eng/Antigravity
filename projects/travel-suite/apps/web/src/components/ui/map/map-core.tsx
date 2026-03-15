"use client";

import MapLibreGL from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";
import { logError } from "@/lib/observability/logger";

import {
  isProbablyHeadless,
  canUseWebGL,
  useResolvedTheme,
  type Theme,
} from "./map-utils";

type MapContextValue = {
  map: MapLibreGL.Map | null;
  isLoaded: boolean;
};

const MapContext = createContext<MapContextValue | null>(null);

function getViewport(map: MapLibreGL.Map): MapViewport {
  const center = map.getCenter();
  return {
    center: [center.lng, center.lat],
    zoom: map.getZoom(),
    bearing: map.getBearing(),
    pitch: map.getPitch(),
  };
}

function useMap() {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error("useMap must be used within a Map component");
  }
  return context;
}

const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const defaultStyles = mapboxToken ? {
  dark: `https://api.mapbox.com/styles/v1/mapbox/dark-v11?access_token=${mapboxToken}`,
  light: `https://api.mapbox.com/styles/v1/mapbox/light-v11?access_token=${mapboxToken}`,
} : {
  // OpenFreeMap: completely free, no API key, no rate limits, open-source tiles
  dark: "https://tiles.openfreemap.org/styles/liberty",
  light: "https://tiles.openfreemap.org/styles/bright",
};

type MapStyleOption = string | MapLibreGL.StyleSpecification;

/** Map viewport state */
type MapViewport = {
  /** Center coordinates [longitude, latitude] */
  center: [number, number];
  /** Zoom level */
  zoom: number;
  /** Bearing (rotation) in degrees */
  bearing: number;
  /** Pitch (tilt) in degrees */
  pitch: number;
};

type MapProps = {
  children?: ReactNode;
  /** Additional CSS classes for the map container */
  className?: string;
  /**
   * Theme for the map. If not provided, automatically detects system preference.
   * Pass your theme value here.
   */
  theme?: Theme;
  /** Custom map styles for light and dark themes. Overrides the default Carto styles. */
  styles?: {
    light?: MapStyleOption;
    dark?: MapStyleOption;
  };
  /** Map projection type. Use `{ type: "globe" }` for 3D globe view. */
  projection?: MapLibreGL.ProjectionSpecification;
  /**
   * Controlled viewport. When provided with onViewportChange,
   * the map becomes controlled and viewport is driven by this prop.
   */
  viewport?: Partial<MapViewport>;
  /**
   * Callback fired continuously as the viewport changes (pan, zoom, rotate, pitch).
   * Can be used standalone to observe changes, or with `viewport` prop
   * to enable controlled mode where the map viewport is driven by your state.
   */
  onViewportChange?: (viewport: MapViewport) => void;
} & Omit<MapLibreGL.MapOptions, "container" | "style">;

type MapRef = MapLibreGL.Map;

const DefaultLoader = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="flex gap-1">
      <span className="size-1.5 rounded-full bg-muted-foreground/60 animate-pulse" />
      <span className="size-1.5 rounded-full bg-muted-foreground/60 animate-pulse [animation-delay:150ms]" />
      <span className="size-1.5 rounded-full bg-muted-foreground/60 animate-pulse [animation-delay:300ms]" />
    </div>
  </div>
);

const Map = forwardRef<MapRef, MapProps>(function Map(
  {
    children,
    className,
    theme: themeProp,
    styles,
    projection,
    viewport,
    onViewportChange,
    ...props
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<MapLibreGL.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isStyleLoaded, setIsStyleLoaded] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const currentStyleRef = useRef<MapStyleOption | null>(null);
  const styleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const internalUpdateRef = useRef(false);
  const resolvedTheme = useResolvedTheme(themeProp);

  const isControlled = viewport !== undefined && onViewportChange !== undefined;

  const onViewportChangeRef = useRef(onViewportChange);
  onViewportChangeRef.current = onViewportChange;

  const mapStyles = useMemo(
    () => ({
      dark: styles?.dark ?? defaultStyles.dark,
      light: styles?.light ?? defaultStyles.light,
    }),
    [styles]
  );

  // Expose the map instance to the parent component
  useImperativeHandle(ref, () => mapInstance as MapLibreGL.Map, [mapInstance]);

  const clearStyleTimeout = useCallback(() => {
    if (styleTimeoutRef.current) {
      clearTimeout(styleTimeoutRef.current);
      styleTimeoutRef.current = null;
    }
  }, []);

  // Initialize the map
  useEffect(() => {
    if (!containerRef.current) return;

    if (isProbablyHeadless() || !canUseWebGL()) {
      setInitError("WebGL not supported");
      return;
    }

    const initialStyle =
      resolvedTheme === "dark" ? mapStyles.dark : mapStyles.light;
    currentStyleRef.current = initialStyle;

    let map: MapLibreGL.Map;
    try {
      map = new MapLibreGL.Map({
        container: containerRef.current,
        style: initialStyle,
        renderWorldCopies: false,
        attributionControl: {
          compact: true,
        },
        ...props,
        ...viewport,
      });
    } catch (error) {
      // Headless browsers or devices without WebGL can throw during initialization.
      // Don't crash the entire app, just render a lightweight fallback container.
      logError("MapLibre map initialization failed", error);
      setInitError(error instanceof Error ? error.message : String(error));
      return;
    }

    const styleDataHandler = () => {
      clearStyleTimeout();
      // Delay to ensure style is fully processed before allowing layer operations
      // This is a workaround to avoid race conditions with the style loading
      // else we have to force update every layer on setStyle change
      styleTimeoutRef.current = setTimeout(() => {
        setIsStyleLoaded(true);
        if (projection) {
          map.setProjection(projection);
        }
      }, 100);
    };
    const loadHandler = () => setIsLoaded(true);

    // Viewport change handler - skip if triggered by internal update
    const handleMove = () => {
      if (internalUpdateRef.current) return;
      onViewportChangeRef.current?.(getViewport(map));
    };

    map.on("load", loadHandler);
    map.on("styledata", styleDataHandler);
    map.on("move", handleMove);
    setMapInstance(map);

    return () => {
      clearStyleTimeout();
      map.off("load", loadHandler);
      map.off("styledata", styleDataHandler);
      map.off("move", handleMove);
      map.remove();
      setIsLoaded(false);
      setIsStyleLoaded(false);
      setMapInstance(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync controlled viewport to map
  useEffect(() => {
    if (!mapInstance || !isControlled || !viewport) return;
    if (mapInstance.isMoving()) return;

    const current = getViewport(mapInstance);
    const next = {
      center: viewport.center ?? current.center,
      zoom: viewport.zoom ?? current.zoom,
      bearing: viewport.bearing ?? current.bearing,
      pitch: viewport.pitch ?? current.pitch,
    };

    if (
      next.center[0] === current.center[0] &&
      next.center[1] === current.center[1] &&
      next.zoom === current.zoom &&
      next.bearing === current.bearing &&
      next.pitch === current.pitch
    ) {
      return;
    }

    internalUpdateRef.current = true;
    mapInstance.jumpTo(next);
    internalUpdateRef.current = false;
  }, [mapInstance, isControlled, viewport]);

  // Handle style change
  useEffect(() => {
    if (!mapInstance || !resolvedTheme) return;

    const newStyle =
      resolvedTheme === "dark" ? mapStyles.dark : mapStyles.light;

    if (currentStyleRef.current === newStyle) return;

    clearStyleTimeout();
    currentStyleRef.current = newStyle;
    setIsStyleLoaded(false);

    mapInstance.setStyle(newStyle, { diff: true });
  }, [mapInstance, resolvedTheme, mapStyles, clearStyleTimeout]);

  const contextValue = useMemo(
    () => ({
      map: mapInstance,
      isLoaded: isLoaded && isStyleLoaded,
    }),
    [mapInstance, isLoaded, isStyleLoaded]
  );

  return (
    <MapContext.Provider value={contextValue}>
      <div
        ref={containerRef}
        className={cn("relative w-full h-full", className)}
      >
        {initError ? (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-xs text-gray-500">
            Map unavailable (WebGL not supported).
          </div>
        ) : (
          !isLoaded && <DefaultLoader />
        )}
        {/* SSR-safe: children render only when map is loaded on client */}
        {mapInstance && children}
      </div>
    </MapContext.Provider>
  );
});

export { Map, useMap, MapContext };
export type { MapRef, MapViewport, MapContextValue };
