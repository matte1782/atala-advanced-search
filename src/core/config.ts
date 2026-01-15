/**
 * Core configuration for Atala Advanced Search
 * Design system tokens and environment constants
 */

export const Config = {
  // Design System
  colors: {
    primary: '#3569F1', // Atala Blue
    lightGray: '#F7F7F7',
    dark: '#1f2937',
    white: '#FFFFFF',
  },

  fonts: {
    system: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },

  spacing: {
    base: 8, // 8px grid system
  },

  animations: {
    duration: 300, // ms
    easing: 'cubic-bezier(0.25, 0.1, 0.25, 1.0)',
    easingElastic: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },

  breakpoints: {
    mobile: 480,
    tablet: 768,
    desktop: 992,
    large: 1280,
    xlarge: 1440,
    xxlarge: 1920,
  },

  // Performance Budgets
  performance: {
    targetFPS: {
      desktop: 60,
      mobile: 30,
    },
    frameBudget: {
      desktop: 16.67, // ms
      mobile: 33.33, // ms
    },
    jsAllocation: {
      desktop: 8, // ms per frame
      mobile: 15, // ms per frame
    },
    memoryLimit: {
      desktop: 200, // MB
      mobile: 35, // MB
    },
    bundleSize: {
      desktop: 110, // KB gzipped
      mobile: 60, // KB gzipped
    },
  },

  // Effect Configuration
  effects: {
    particleTypography: {
      countDesktop: 100,
      countMobile: 50,
      springStrength: 0.15,
      springDamping: 0.85,
      mouseInfluenceRadius: 150,
      mouseRepulsionForce: 8,
    },
    magneticCursor: {
      radius: 200,
      strength: 0.4,
      springStrength: 0.15,
      damping: 0.92,
      maxDisplacement: 40,
    },
    particleDissolution: {
      countDesktop: 500,
      countMobile: 200,
      explosionForce: 15,
      gravity: 0.5,
      lifetime: 1200, // ms
    },
    shaderMorphing: {
      noiseScale: 3.5,
      distortionStrength: 0.15,
      textureSize: {
        desktop: 1024,
        mobile: 512,
      },
    },
    scrollPhysics: {
      lerpFactor: 0.08,
      velocityThreshold: 0.5,
      distortionStrength: 0.3,
      scrollCurve: [0.22, 0.61, 0.36, 1],
    },
  },

  // Webflow Site IDs
  webflow: {
    siteId: '68ae23a6bd87ffe50f9ac0af',
    locales: {
      italian: {
        id: '68b763dbf3e5b69d0be67cb0',
        cmsId: '68b763dbf3e5b69d0be67ca4',
        tag: 'it',
      },
      english: {
        id: '68ebf5b73a32841ce64b6eb2',
        cmsId: '68ebf5b73a32841ce64b6eb9',
        tag: 'en',
      },
    },
    collections: {
      products: '68e4177b08767c6dcccd4b7e',
      categories: '68b763db280ed553319bc453',
      subcategories: '68d988945f5c5c405f6b2025',
      kits: '68e4178d1e40ae8b10096cc7',
    },
  },
} as const;

export type ConfigType = typeof Config;
