/**
 * Global TypeScript type definitions for Atala Advanced Search
 */

// ============================================================================
// Vector Mathematics
// ============================================================================

export interface IVector2 {
  x: number;
  y: number;
}

export class Vector2 implements IVector2 {
  constructor(public x: number = 0, public y: number = 0) {}

  set(x: number, y: number): Vector2 {
    this.x = x;
    this.y = y;
    return this;
  }

  clone(): Vector2 {
    return new Vector2(this.x, this.y);
  }

  add(v: Vector2): Vector2 {
    return new Vector2(this.x + v.x, this.y + v.y);
  }

  subtract(v: Vector2): Vector2 {
    return new Vector2(this.x - v.x, this.y - v.y);
  }

  multiply(scalar: number): Vector2 {
    return new Vector2(this.x * scalar, this.y * scalar);
  }

  divide(scalar: number): Vector2 {
    return new Vector2(this.x / scalar, this.y / scalar);
  }

  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  distance(v: Vector2): number {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  normalize(): Vector2 {
    const len = this.length();
    if (len === 0) return new Vector2(0, 0);
    return new Vector2(this.x / len, this.y / len);
  }

  dot(v: Vector2): number {
    return this.x * v.x + this.y * v.y;
  }
}

// ============================================================================
// Product Data
// ============================================================================

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: {
    id: string;
    name: string;
  };
  subcategory: {
    id: string;
    name: string;
  };
  price: number;
  priceOriginal: number;
  motor?: string;
  battery?: string;
  gearing?: string;
  wheelSize?: string;
  image: string;
  imageDetail?: string;
  description?: string;
}

export interface FilterCriteria {
  categories: string[];
  subcategories: string[];
  priceMin: number;
  priceMax: number;
  motors: string[];
  batteries: string[];
  gearing: string[];
  wheelSizes: string[];
  searchQuery: string;
}

// ============================================================================
// Device Capabilities
// ============================================================================

export interface DeviceCapabilities {
  isMobile: boolean;
  isTouch: boolean;
  hasWebGL: boolean;
  hasWebGL2: boolean;
  cpuCores: number;
  memory: number; // GB
  pixelRatio: number;
  prefersReducedMotion: boolean;
  isHighEnd: boolean;
  isMidTier: boolean;
  isLowEnd: boolean;
  gpuTier: 'high' | 'mid' | 'low' | 'unknown';
}

export type PowerProfile = 'performance' | 'balanced' | 'battery-saver';

// ============================================================================
// Effect Configuration
// ============================================================================

export interface EffectConfig {
  particles: {
    enabled: boolean;
    count?: number;
    updateRate?: number;
  };
  shaders: {
    enabled: boolean;
    quality?: 'low' | 'medium' | 'high';
  };
  physics: {
    enabled: boolean;
    simplified?: boolean;
  };
  magnetic: {
    enabled: boolean;
    radius?: number;
    simplified?: boolean;
  };
  dissolution: {
    enabled: boolean;
    particleCount?: number;
  };
  basicAnimations: {
    enabled: boolean;
    duration?: number;
  };
}

// ============================================================================
// Particle System
// ============================================================================

export interface Particle {
  position: Vector2;
  oldPosition: Vector2;
  acceleration: Vector2;
  mass: number;
  life: number;
  maxLife: number;
  size: number;
  opacity: number;
  active: boolean;
}

export interface TypographyParticle extends Particle {
  homePosition: Vector2;
}

export interface CanvasParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  opacity: number;
}

// ============================================================================
// Performance Monitoring
// ============================================================================

export interface PerformanceMetrics {
  fps: number;
  frameDuration: number;
  droppedFrames: number;
  heapUsed: number;
  heapLimit: number;
  LCP?: number;
  FID?: number;
  CLS?: number;
  INP?: number;
}

export interface PerformanceReport {
  avg: number;
  p50: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
}

// ============================================================================
// Animation
// ============================================================================

export interface AnimationTask {
  callback: (dt: number) => void;
  priority: number;
}

// ============================================================================
// Events
// ============================================================================

export type EventCallback = (...args: any[]) => void;

export interface EventMap {
  'effect:loaded': { name: string; duration: number };
  'effect:fps_drop': { name: string; fps: number; expected: number };
  'filter:changed': FilterCriteria;
  'product:selected': Product;
  'search:query': string;
}

// ============================================================================
// Battery API (experimental)
// ============================================================================

export interface BatteryManager extends EventTarget {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
  addEventListener(type: 'chargingchange' | 'levelchange', listener: EventListenerOrEventListenerObject): void;
  removeEventListener(type: 'chargingchange' | 'levelchange', listener: EventListenerOrEventListenerObject): void;
}

declare global {
  interface Navigator {
    getBattery?: () => Promise<BatteryManager>;
    deviceMemory?: number;
    hardwareConcurrency?: number;
    connection?: {
      effectiveType: '4g' | '3g' | '2g' | 'slow-2g';
    };
  }

  interface Performance {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  }
}

export {};
