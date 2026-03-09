import React, { useEffect, useRef, useState } from 'react';
import p5 from 'p5';

export interface ForceFieldBackgroundProps {
  /**
   * URL of the image to use as the base for the particle field
   * @default "https://cdn.pixabay.com/photo/2024/12/13/20/29/alps-9266131_1280.jpg"
   */
  imageUrl?: string;
  /**
   * Base hue for the color palette (0-360)
   * @default 210
   */
  hue?: number;
  /**
   * Color saturation (0-100)
   * @default 100
   */
  saturation?: number;
  /**
   * Brightness threshold for particle visibility (0-255)
   * @default 255
   */
  threshold?: number;
  /**
   * Minimum stroke weight for particles
   * @default 2
   */
  minStroke?: number;
  /**
   * Maximum stroke weight for particles
   * @default 6
   */
  maxStroke?: number;
  /**
   * Spacing between particles (lower = more density)
   * @default 10
   */
  spacing?: number;
  /**
   * Noise scale for particle placement irregularity
   * @default 0
   */
  noiseScale?: number;
  /**
   * Density factor (probability of particle existence)
   * @default 2.0
   */
  density?: number;
  /**
   * Invert the source image brightness mapping
   * @default true
   */
  invertImage?: boolean;
  /**
   * Invert the wireframe/particle visibility condition
   * @default true
   */
  invertWireframe?: boolean;
  /**
   * Enable the magnifier/force field effect
   * @default true
   */
  magnifierEnabled?: boolean;
  /**
   * Radius of the force field effect around the cursor
   * @default 150
   */
  magnifierRadius?: number;
  /**
   * Strength of the force pushing particles away
   * @default 10
   */
  forceStrength?: number;
  /**
   * Friction factor for particle movement (0-1)
   * @default 0.9
   */
  friction?: number;
  /**
   * Speed at which particles return to original position
   * @default 0.05
   */
  restoreSpeed?: number;
  /**
   * Additional CSS class names
   */
  className?: string;
}

/**
 * ForceFieldBackground
 * 
 * An interactive, particle-based background that reacts to mouse movement.
 * It uses an underlying image to determine particle color and size, creating
 * a "force field" effect where particles are pushed away by the cursor.
 */
export function ForceFieldBackground({
  imageUrl = "/force_field_map.jpg",
  hue = 190, // Keeping our theme color
  saturation = 80,
  threshold = 255,
  minStroke = 2,
  maxStroke = 6,
  spacing = 10,
  noiseScale = 0,
  density = 2.0,
  invertImage = true,
  invertWireframe = true,
  magnifierEnabled = true,
  magnifierRadius = 400, // Kept higher so it's noticeable safely
  forceStrength = 10,
  friction = 0.9,
  restoreSpeed = 0.05,
  className = "",
}: ForceFieldBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5InstanceRef = useRef<p5 | null>(null);
    const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugLog, setDebugLog] = useState<any>({});

  // Keep latest props in ref to access inside p5 closure without re-instantiating
  const propsRef = useRef({
    hue, saturation, threshold, minStroke, maxStroke, spacing, noiseScale, 
    density, invertImage, invertWireframe, magnifierEnabled, magnifierRadius,
    forceStrength, friction, restoreSpeed
  });

  useEffect(() => {
    propsRef.current = {
      hue, saturation, threshold, minStroke, maxStroke, spacing, noiseScale,
      density, invertImage, invertWireframe, magnifierEnabled, magnifierRadius,
      forceStrength, friction, restoreSpeed
    };
  }, [hue, saturation, threshold, minStroke, maxStroke, spacing, noiseScale, density, invertImage, invertWireframe, magnifierEnabled, magnifierRadius, forceStrength, friction, restoreSpeed]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Cleanup previous instance if exists
    if (p5InstanceRef.current) {
      p5InstanceRef.current.remove();
    }

    // Global mouse tracking so we can detect movement even if pointer-events: none (e.g. over Spline)
    let globalMouseX = window.innerWidth / 2;
    let globalMouseY = window.innerHeight / 2;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        globalMouseX = e.clientX - rect.left;
        globalMouseY = e.clientY - rect.top;
      }
    };

    window.addEventListener('mousemove', handleGlobalMouseMove, { capture: true });

    let isMounted = true;

    const sketch = (p: p5) => {
      let originalImg: p5.Image;
      let img: p5.Image;
      let palette: p5.Color[] = [];
      let points: {
        pos: p5.Vector;
        originalPos: p5.Vector;
        vel: p5.Vector;
      }[] = [];
      
      // Internal state tracking to detect changes
      let lastHue = -1;
      let lastSaturation = -1;
      let lastSpacing = -1;
      let lastNoiseScale = -1;
      let lastDensity = -1;
      let lastInvertImage: boolean | null = null;
      let magnifierX = typeof window !== 'undefined' ? window.innerWidth / 2 : 500;
      let magnifierY = typeof window !== 'undefined' ? window.innerHeight / 2 : 500;
      let magnifierInertia = 0.1;

      p.setup = () => {
        // Create canvas synchronously to avoid appendChild race condition in React StrictMode
        if (containerRef.current) {
          let cw = containerRef.current.clientWidth;
          let ch = containerRef.current.clientHeight;
          // Fallback if DOM hasn't fully painted (React hydration bug)
          if (cw <= 0 || ch <= 0) {
            cw = window.innerWidth;
            ch = window.innerHeight;
          }
          p.createCanvas(cw, ch);
          magnifierX = p.width / 2;
          magnifierY = p.height / 2;
        }

        p.loadImage(
          imageUrl,
          (loadedImg) => {
            if (!isMounted) return;
            originalImg = loadedImg;
            setIsLoading(false);
            processImage();
            generatePalette(propsRef.current.hue, propsRef.current.saturation);
            generatePoints();
            
            // set debug loaded
            setDebugLog((prev: any) => ({ ...prev, imageLoaded: true, imgW: loadedImg.width, imgH: loadedImg.height }));
          },
          (err) => {
            if (!isMounted) return;
            console.error("Failed to load image", err);
            setError("Failed to load image");
            setIsLoading(false);
            setDebugLog((prev: any) => ({ ...prev, error: err }));
          }
        );
      };

      p.windowResized = () => {
        if (!containerRef.current || !originalImg) return;
        const { clientWidth, clientHeight } = containerRef.current;
        p.resizeCanvas(clientWidth, clientHeight);
        processImage();
        generatePoints();
        setDebugLog((prev: any) => ({ ...prev, resized: { w: clientWidth, h: clientHeight } }));
      };

      function processImage() {
        if (!originalImg) return;
        img = originalImg.get();
        // Resize image to match canvas for 1:1 pixel mapping
        if (p.width > 0 && p.height > 0) {
          img.resize(p.width, p.height);
        }
        img.filter(p.GRAY);

        if (propsRef.current.invertImage) {
          img.loadPixels();
          for (let i = 0; i < img.pixels.length; i += 4) {
            img.pixels[i] = 255 - img.pixels[i];
            img.pixels[i + 1] = 255 - img.pixels[i + 1];
            img.pixels[i + 2] = 255 - img.pixels[i + 2];
          }
          img.updatePixels();
        }
        
        // HUGE PERFORMANCE FIX: Call loadPixels() exactly *once* during generation, 
        // NEVER inside the 60FPS draw() loop!
        img.loadPixels();
        
        lastInvertImage = propsRef.current.invertImage;
      }

      function generatePalette(h: number, s: number) {
        palette = [];
        p.push();
        p.colorMode(p.HSL);
        for (let i = 0; i < 12; i++) {
          let lightness = p.map(i, 0, 11, 95, 5);
          palette.push(p.color(h, s, lightness));
        }
        p.pop();
      }

      function generatePoints() {
        if (!img) return;
        points = [];
        const { spacing, density, noiseScale } = propsRef.current;
        
        // Guard against infinite loop or too many points
        const safeSpacing = Math.max(2, spacing); 

        for (let y = 0; y < img.height; y += safeSpacing) {
          for (let x = 0; x < img.width; x += safeSpacing) {
            if (p.random() > density) continue;
            
            let nx = p.noise(x * noiseScale, y * noiseScale) - 0.5;
            let ny = p.noise((x + 500) * noiseScale, (y + 500) * noiseScale) - 0.5;
            let px = x + nx * safeSpacing;
            let py = y + ny * safeSpacing;
            
            points.push({
              pos: p.createVector(px, py),
              originalPos: p.createVector(px, py),
              vel: p.createVector(0, 0)
            });
          }
        }
        
        lastSpacing = spacing;
        lastNoiseScale = noiseScale;
        lastDensity = density;

        setDebugLog((prev: any) => ({ ...prev, pointsCount: points.length }));
      }

      function applyForceField(mx: number, my: number) {
        const props = propsRef.current;
        if (!props.magnifierEnabled) return;

        for (let pt of points) {
          // Repel force (from user's prompt)
          let dir = p5.Vector.sub(pt.pos, p.createVector(mx, my));
          let d = dir.mag();
          
          if (d < props.magnifierRadius) {
            dir.normalize();
            let force = dir.mult(props.forceStrength / Math.max(1, d)); // Avoid div by zero
            pt.vel.add(force);
          }
          
          // Friction
          pt.vel.mult(props.friction);
          
          // Restore force (spring back to original)
          let restore = p5.Vector.sub(pt.originalPos, pt.pos).mult(props.restoreSpeed);
          pt.vel.add(restore);
          
          // Update position
          pt.pos.add(pt.vel);
        }
      }

      p.draw = () => {
        // Wait until image is loaded and processed
        if (!img) {
          p.clear();
          return;
        }
        // Clear with a faint red tint to verify canvas visibility
        p.background(50, 0, 0, 100); 

        const props = propsRef.current;

        // Check for prop changes that require regeneration
        if (props.hue !== lastHue || props.saturation !== lastSaturation) {
          generatePalette(props.hue, props.saturation);
          lastHue = props.hue;
          lastSaturation = props.saturation;
        }

        if (props.invertImage !== lastInvertImage) {
          processImage(); // This sets lastInvertImage
        }

        if (props.spacing !== lastSpacing || props.noiseScale !== lastNoiseScale || props.density !== lastDensity) {
          generatePoints();
        }

        // Mouse interaction using global tracking
        let mx = typeof globalMouseX !== "undefined" ? globalMouseX : magnifierX;
        let my = typeof globalMouseY !== "undefined" ? globalMouseY : magnifierY;
       
        magnifierX = p.lerp(magnifierX, mx, magnifierInertia);
        magnifierY = p.lerp(magnifierY, my, magnifierInertia);

        applyForceField(magnifierX, magnifierY);

        p.noFill();

        for (let pt of points) {
          let x = pt.pos.x;
          let y = pt.pos.y;
          let d = p.dist(x, y, magnifierX, magnifierY);
          
          let px = p.constrain(p.floor(x), 0, img.width - 1);
          let py = p.constrain(p.floor(y), 0, img.height - 1);
          
          // Access pixel data (RGBA)
          let index = (px + py * img.width) * 4;
          // Just use R channel since it's grayscale
          let brightness = img.pixels[index]; 
          
          // Guard against undefined brightness if image resized or not ready
          if (brightness === undefined) continue;

          let condition = props.invertWireframe
            ? brightness < props.threshold
            : brightness > props.threshold;

          if (condition) {
            let shadeIndex = Math.floor(p.map(brightness, 0, 255, 0, palette.length - 1));
            shadeIndex = p.constrain(shadeIndex, 0, palette.length - 1);
            
            let strokeSize = p.map(brightness, 0, 255, props.minStroke, props.maxStroke);
            
            if (props.magnifierEnabled && d < props.magnifierRadius) {
              let factor = p.map(d, 0, props.magnifierRadius, 2, 1); // 2x size at center
              strokeSize *= factor;
            }
            
            if (palette[shadeIndex]) {
              p.stroke(palette[shadeIndex]);
              p.strokeWeight(strokeSize);
              p.point(x, y);
            }
          }
        }

        // DEBUG: Draw a big green circle at the cursor to verify it's updating
        p.fill(0, 255, 0);
        p.noStroke();
        p.circle(magnifierX, magnifierY, 100);

        if (p.frameCount % 60 === 0) {
           setDebugLog((prev: any) => ({ 
             ...prev, 
             drawing: true, 
             frameCount: p.frameCount, 
             canvasW: p.width,
             canvasH: p.height,
             firstPointPos: points.length > 0 ? `${points[0].pos.x.toFixed(1)}, ${points[0].pos.y.toFixed(1)}` : 'none'
           }));
        }
      };
    };

    const myP5 = new p5(sketch, containerRef.current);
    p5InstanceRef.current = myP5;

    return () => {
      isMounted = false;
      window.removeEventListener('mousemove', handleGlobalMouseMove, { capture: true });
      myP5.remove();
    };
  }, [imageUrl]); // Re-init if imageUrl changes

  return (
    <div 
      className={`relative w-full h-full overflow-hidden bg-transparent ${className}`} 
      ref={containerRef}
    >
      {/* {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center text-white/50 text-xs tracking-widest uppercase">
          Initializing Force Field...
        </div>
      )} */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-red-500/70 text-xs tracking-widest uppercase bg-black/50">
          {error}
        </div>
      )}
      
      {/* ON-SCREEN DEBUGGER */}
      <div className="absolute top-0 left-0 bg-red-900/90 text-white p-4 font-mono text-[10px] z-50 rounded-br-xl pointer-events-none">
         <h4 className="font-bold border-b border-red-500 pb-1 mb-2">FORCE FIELD DEBUG</h4>
         <pre>{JSON.stringify(debugLog, null, 2)}</pre>
      </div>
    </div>
  );
}

export default ForceFieldBackground;
