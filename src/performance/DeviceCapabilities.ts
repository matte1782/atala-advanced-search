/**
 * Device Capability Detection
 * Detects hardware capabilities for progressive enhancement
 */

import type { DeviceCapabilities, PowerProfile } from '@core/types';

export class DeviceCapabilityDetector {
  private capabilities: DeviceCapabilities | null = null;

  detect(): DeviceCapabilities {
    if (this.capabilities) {
      return this.capabilities;
    }

    const isMobile = this.detectMobile();
    const isTouch = this.detectTouch();
    const hasWebGL = this.detectWebGL();
    const hasWebGL2 = this.detectWebGL2();
    const cpuCores = this.detectCPUCores();
    const memory = this.detectMemory();
    const pixelRatio = window.devicePixelRatio || 1;
    const prefersReducedMotion = this.detectReducedMotion();
    const gpuTier = this.detectGPUTier();

    // Determine device tier based on multiple factors
    const isHighEnd = !isMobile && cpuCores >= 4 && memory >= 4 && gpuTier === 'high';
    const isMidTier = !isMobile && (cpuCores >= 4 || memory >= 4 || gpuTier === 'mid');
    const isLowEnd = isMobile || (!isHighEnd && !isMidTier);

    this.capabilities = {
      isMobile,
      isTouch,
      hasWebGL,
      hasWebGL2,
      cpuCores,
      memory,
      pixelRatio,
      prefersReducedMotion,
      isHighEnd,
      isMidTier,
      isLowEnd,
      gpuTier,
    };

    return this.capabilities;
  }

  private detectMobile(): boolean {
    return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
  }

  private detectTouch(): boolean {
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      (navigator as any).msMaxTouchPoints > 0
    );
  }

  private detectWebGL(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(
        canvas.getContext('webgl') ||
        canvas.getContext('experimental-webgl')
      );
    } catch (e) {
      return false;
    }
  }

  private detectWebGL2(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!canvas.getContext('webgl2');
    } catch (e) {
      return false;
    }
  }

  private detectCPUCores(): number {
    return navigator.hardwareConcurrency || 2;
  }

  private detectMemory(): number {
    return navigator.deviceMemory || 4;
  }

  private detectReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private detectGPUTier(): 'high' | 'mid' | 'low' | 'unknown' {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');

    if (!gl) return 'unknown';

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return 'unknown';

    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();

    // High-end GPUs
    if (
      /nvidia|geforce rtx|radeon rx|apple m[1-9]|mali-g[7-9]/i.test(renderer)
    ) {
      return 'high';
    }

    // Integrated/mid-tier GPUs
    if (/intel|iris|uhd graphics|vega/i.test(renderer)) {
      return 'mid';
    }

    // Low-end or unknown
    return 'low';
  }

  getCapabilities(): DeviceCapabilities {
    return this.detect();
  }
}

/**
 * Battery-aware performance management
 */
export class BatteryManager {
  private batteryMonitor: any = null;
  private isCharging: boolean = true;
  private level: number = 1.0;
  private listeners: Set<(profile: PowerProfile) => void> = new Set();

  async init(): Promise<void> {
    if ('getBattery' in navigator && navigator.getBattery) {
      try {
        this.batteryMonitor = await navigator.getBattery();

        this.isCharging = this.batteryMonitor.charging;
        this.level = this.batteryMonitor.level;

        this.batteryMonitor.addEventListener('chargingchange', () => {
          this.isCharging = this.batteryMonitor.charging;
          this.notifyListeners();
        });

        this.batteryMonitor.addEventListener('levelchange', () => {
          this.level = this.batteryMonitor.level;
          this.notifyListeners();
        });

        this.notifyListeners();
      } catch (error) {
        console.warn('[BatteryManager] Battery API not available:', error);
      }
    }
  }

  getCurrentProfile(): PowerProfile {
    if (this.isCharging) {
      return 'performance';
    }

    if (this.level < 0.20) {
      return 'battery-saver';
    }

    if (this.level < 0.50) {
      return 'balanced';
    }

    return 'performance';
  }

  subscribe(callback: (profile: PowerProfile) => void): () => void {
    this.listeners.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(): void {
    const profile = this.getCurrentProfile();
    this.listeners.forEach((callback) => callback(profile));
  }

  getBatteryLevel(): number {
    return this.level;
  }

  isDeviceCharging(): boolean {
    return this.isCharging;
  }
}

// Export singleton instances
export const deviceCapabilities = new DeviceCapabilityDetector();
export const batteryManager = new BatteryManager();
