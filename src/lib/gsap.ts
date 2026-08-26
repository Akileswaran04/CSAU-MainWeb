import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register once on module load
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export { gsap, ScrollTrigger };
