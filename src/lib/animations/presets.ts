/** Shared Motion presets — microinteractions & UI transitions */
export const motionPresets = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const },
  },
  slideUp: {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 10 },
    transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.96 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.98 },
    transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] as const },
  },
  modal: {
    overlay: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.2 },
    },
    content: {
      initial: { opacity: 0, scale: 0.96, y: 8 },
      animate: { opacity: 1, scale: 1, y: 0 },
      exit: { opacity: 0, scale: 0.98, y: 4 },
      transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const },
    },
  },
  drawer: {
    initial: { x: "100%" },
    animate: { x: 0 },
    exit: { x: "100%" },
    transition: { type: "spring" as const, damping: 28, stiffness: 280 },
  },
  stagger: {
    container: {
      animate: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
    },
    item: {
      initial: { opacity: 0, y: 12 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const },
    },
  },
} as const;

/** GSAP defaults for scroll reveals (store / marketing) */
export const gsapDefaults = {
  duration: 0.75,
  ease: "power2.out",
  y: 28,
  stagger: 0.08,
} as const;
