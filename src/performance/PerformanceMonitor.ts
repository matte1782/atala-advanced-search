/**
 * Performance Monitoring System
 * Tracks FPS, memory usage, frame budget violations
 */

import type { PerformanceMetrics, PerformanceReport } from '@core/types';
import { Config } from '@core/config';
import { eventBus } from '@core/eventBus';

export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  private reportInterval: number = 5000; // 5s
  private isRunning: boolean = false;
  private rafId: number | null = null;

  // FPS tracking
  private frameCount: number = 0;
  private lastFpsTime: number = 0;
  private currentFPS: number = 60;

  // Frame budget tracking
  private lastFrameTime: number = 0;
  private droppedFrames: number = 0;

  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.lastFpsTime = performance.now();
    this.lastFrameTime = performance.now();

    this.trackFPS();
    this.trackMemory();
    this.trackCoreWebVitals();

    // Periodic reporting
    setInterval(() => this.report(), this.reportInterval);
  }

  stop(): void {
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private trackFPS(): void {
    const measureFPS = () => {
      if (!this.isRunning) return;

      this.frameCount++;
      const now = performance.now();

      // Calculate FPS every second
      if (now >= this.lastFpsTime + 1000) {
        this.currentFPS = Math.round((this.frameCount * 1000) / (now - this.lastFpsTime));
        this.record('fps', this.currentFPS);

        // Emit event if FPS drops significantly
        const targetFPS = Config.performance.targetFPS.desktop;
        if (this.currentFPS < targetFPS * 0.8) {
          eventBus.emit('effect:fps_drop', {
            name: 'global',
            fps: this.currentFPS,
            expected: targetFPS,
          });
        }

        this.frameCount = 0;
        this.lastFpsTime = now;
      }

      // Track frame duration
      const frameDuration = now - this.lastFrameTime;
      this.lastFrameTime = now;

      this.record('frameDuration', frameDuration);

      if (frameDuration > Config.performance.frameBudget.desktop) {
        this.droppedFrames++;
        this.record('droppedFrames', 1);
      }

      this.rafId = requestAnimationFrame(measureFPS);
    };

    this.rafId = requestAnimationFrame(measureFPS);
  }

  private trackMemory(): void {
    if ('memory' in performance) {
      setInterval(() => {
        if (!this.isRunning) return;

        const mem = (performance as any).memory;
        const heapUsedMB = mem.usedJSHeapSize / 1048576;
        const heapLimitMB = mem.jsHeapSizeLimit / 1048576;

        this.record('heapUsed', heapUsedMB);
        this.record('heapLimit', heapLimitMB);

        // Warn if approaching memory limit
        if (heapUsedMB > heapLimitMB * 0.8) {
          console.warn(`[PerformanceMonitor] High memory usage: ${heapUsedMB.toFixed(1)}MB / ${heapLimitMB.toFixed(1)}MB`);
        }
      }, 1000);
    }
  }

  private trackCoreWebVitals(): void {
    // Largest Contentful Paint (LCP)
    try {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        this.record('LCP', lastEntry.renderTime || lastEntry.loadTime);
      }).observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      console.warn('[PerformanceMonitor] LCP tracking not supported');
    }

    // First Input Delay (FID)
    try {
      new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          this.record('FID', entry.processingStart - entry.startTime);
        });
      }).observe({ entryTypes: ['first-input'] });
    } catch (e) {
      console.warn('[PerformanceMonitor] FID tracking not supported');
    }

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    try {
      new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.record('CLS', clsValue);
          }
        });
      }).observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      console.warn('[PerformanceMonitor] CLS tracking not supported');
    }
  }

  private record(metric: string, value: number): void {
    if (!this.metrics.has(metric)) {
      this.metrics.set(metric, []);
    }
    this.metrics.get(metric)!.push(value);

    // Limit buffer size to prevent memory issues
    const buffer = this.metrics.get(metric)!;
    if (buffer.length > 1000) {
      buffer.shift();
    }
  }

  private report(): void {
    if (this.metrics.size === 0) return;

    const report: Record<string, PerformanceReport> = {};

    this.metrics.forEach((values, metric) => {
      if (values.length === 0) return;

      const sorted = values.slice().sort((a, b) => a - b);
      report[metric] = {
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        p50: sorted[Math.floor(sorted.length * 0.5)],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)],
        min: sorted[0],
        max: sorted[sorted.length - 1],
      };
    });

    console.table(report);

    // Send to analytics (if available)
    if ((window as any).gtag) {
      (window as any).gtag('event', 'performance_metrics', report);
    }

    // Clear old buffers but keep recent data
    this.metrics.forEach((values, key) => {
      if (values.length > 100) {
        this.metrics.set(key, values.slice(-100));
      }
    });
  }

  getMetrics(): PerformanceMetrics {
    return {
      fps: this.currentFPS,
      frameDuration: this.getAverage('frameDuration'),
      droppedFrames: this.droppedFrames,
      heapUsed: this.getAverage('heapUsed'),
      heapLimit: this.getAverage('heapLimit'),
      LCP: this.getAverage('LCP'),
      FID: this.getAverage('FID'),
      CLS: this.getAverage('CLS'),
    };
  }

  private getAverage(metric: string): number {
    const values = this.metrics.get(metric);
    if (!values || values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  getCurrentFPS(): number {
    return this.currentFPS;
  }

  getDroppedFrames(): number {
    return this.droppedFrames;
  }

  reset(): void {
    this.metrics.clear();
    this.frameCount = 0;
    this.droppedFrames = 0;
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();
