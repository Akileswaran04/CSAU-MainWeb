"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/* ============================================================================
   USE PARALLAX — scroll-linked depth transforms.
   
   Applies a subtle vertical translation to an element based on scroll position,
   creating the illusion that the element is at a different depth than the page.
   
   Speed values:
     - Negative (e.g. -0.3): element moves UP slower than scroll → feels far away
     - Zero: element scrolls normally with the page
     - Positive (e.g. 0.3): element moves DOWN relative to scroll → feels closer
   
   The effect is contained within the parent section's scroll range.
   ========================================================================== */

interface ParallaxOptions {
  /** Speed multiplier. Negative = slower (far), positive = faster (near). Default: -0.3 */
  speed?: number;
  /** Whether to apply the effect. Default: true */
  enabled?: boolean;
  /** Custom start position for ScrollTrigger. Default: "top bottom" */
  start?: string;
  /** Custom end position for ScrollTrigger. Default: "bottom top" */
  end?: string;
}

export function useParallax<T extends HTMLElement = HTMLDivElement>(
  options: ParallaxOptions = {}
) {
  const { speed = -0.3, enabled = true, start = "top bottom", end = "bottom top" } = options;
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!enabled || !ref.current) return;

    const el = ref.current;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const st = ScrollTrigger.create({
      trigger: el,
      start,
      end,
      scrub: 0.5,
      onUpdate: (self) => {
        // self.progress goes from 0 to 1 as the element scrolls through the viewport
        // Map it to a pixel offset: progress 0→1 maps to a range of ±speed * sectionHeight
        const yOffset = self.progress * speed * 200; // 200px base range
        gsap.set(el, { y: yOffset, force3D: true });
      },
    });

    return () => {
      st.kill();
      gsap.set(el, { y: 0, clearProps: "transform" });
    };
  }, [speed, enabled, start, end]);

  return ref;
}

/* ============================================================================
   USE PARALLAX GROUP — applies different parallax speeds to multiple children.
   
   Usage:
     const group = useParallaxGroup();
     <div ref={group.containerRef}>
       <div ref={group.layerRef(0)}>slow background</div>
       <div ref={group.layerRef(1)}>mid layer</div>
       <div ref={group.layerRef(2)}>fast foreground</div>
     </div>
   ========================================================================== */

export function useParallaxGroup() {
  const containerRef = useRef<HTMLDivElement>(null);
  const layerRefs = useRef<Map<number, HTMLElement>>(new Map());
  const triggersRef = useRef<ScrollTrigger[]>([]);

  const layerRef = (index: number) => (el: HTMLElement | null) => {
    if (el) {
      layerRefs.current.set(index, el);
    } else {
      layerRefs.current.delete(index);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    // Cleanup previous triggers
    triggersRef.current.forEach((t) => t.kill());
    triggersRef.current = [];

    // Default speed profile: [far, mid, near]
    const speeds = [-0.4, -0.15, 0.1, 0.25];

    layerRefs.current.forEach((el, index) => {
      const speed = speeds[index % speeds.length];
      const st = ScrollTrigger.create({
        trigger: container,
        start: "top bottom",
        end: "bottom top",
        scrub: 0.5,
        onUpdate: (self) => {
          const yOffset = self.progress * speed * 200;
          gsap.set(el, { y: yOffset, force3D: true });
        },
      });
      triggersRef.current.push(st);
    });

    return () => {
      triggersRef.current.forEach((t) => t.kill());
      triggersRef.current = [];
      layerRefs.current.forEach((el) => {
        gsap.set(el, { y: 0, clearProps: "transform" });
      });
    };
  }, []);

  return { containerRef, layerRef };
}
