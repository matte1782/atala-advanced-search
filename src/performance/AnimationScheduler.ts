/**
 * Centralized RequestAnimationFrame Scheduler
 * Coordinates all animations in a single RAF loop for optimal performance
 */

import type { AnimationTask } from '@core/types';
import { Config } from '@core/config';

export class AnimationScheduler {
  private static instance: AnimationScheduler;
  private tasks: Map<string, AnimationTask> = new Map();
  private running: boolean = false;
  private lastTime: number = 0;
  private rafId: number | null = null;
  private frameBudget: number;

  private constructor() {
    this.frameBudget = Config.performance.frameBudget.desktop;
  }

  static getInstance(): AnimationScheduler {
    if (!AnimationScheduler.instance) {
      AnimationScheduler.instance = new AnimationScheduler();
    }
    return AnimationScheduler.instance;
  }

  /**
   * Register an animation task
   * @param id Unique identifier for the task
   * @param callback Function to call each frame
   * @param priority Higher priority tasks run first (0-100)
   */
  register(id: string, callback: (dt: number) => void, priority: number = 50): void {
    this.tasks.set(id, { callback, priority });

    if (!this.running) {
      this.start();
    }
  }

  /**
   * Unregister an animation task
   */
  unregister(id: string): void {
    this.tasks.delete(id);

    if (this.tasks.size === 0) {
      this.stop();
    }
  }

  /**
   * Check if a task is registered
   */
  has(id: string): boolean {
    return this.tasks.has(id);
  }

  /**
   * Get number of active tasks
   */
  getTaskCount(): number {
    return this.tasks.size;
  }

  /**
   * Update frame budget (for mobile/battery optimization)
   */
  setFrameBudget(budget: number): void {
    this.frameBudget = budget;
  }

  /**
   * Start the animation loop
   */
  private start(): void {
    if (this.running) return;

    this.running = true;
    this.lastTime = performance.now();
    this.tick();
  }

  /**
   * Stop the animation loop
   */
  private stop(): void {
    this.running = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Main animation loop
   */
  private tick = (): void => {
    if (!this.running) return;

    const now = performance.now();
    const dt = now - this.lastTime;
    this.lastTime = now;

    // Sort tasks by priority (highest first)
    const sortedTasks = Array.from(this.tasks.entries())
      .sort(([, a], [, b]) => b.priority - a.priority);

    let budget = this.frameBudget;

    // Execute tasks with budget monitoring
    for (const [id, { callback }] of sortedTasks) {
      const start = performance.now();

      try {
        callback(dt);
      } catch (error) {
        console.error(`[AnimationScheduler] Error in task "${id}":`, error);
        // Remove failing tasks to prevent cascading failures
        this.tasks.delete(id);
        continue;
      }

      const elapsed = performance.now() - start;
      budget -= elapsed;

      // If we're over budget, defer remaining tasks to next frame
      if (budget <= 0) {
        const remaining = sortedTasks.length - sortedTasks.indexOf([id, { callback, priority: 0 }]) - 1;
        if (remaining > 0) {
          console.warn(`[AnimationScheduler] Frame budget exceeded by ${-budget.toFixed(2)}ms. Deferred ${remaining} tasks.`);
        }
        break;
      }
    }

    this.rafId = requestAnimationFrame(this.tick);
  };

  /**
   * Pause all animations
   */
  pause(): void {
    this.running = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Resume all animations
   */
  resume(): void {
    if (!this.running && this.tasks.size > 0) {
      this.start();
    }
  }

  /**
   * Clear all tasks
   */
  clear(): void {
    this.stop();
    this.tasks.clear();
  }

  /**
   * Get debug info
   */
  getDebugInfo(): {
    running: boolean;
    taskCount: number;
    tasks: Array<{ id: string; priority: number }>;
  } {
    return {
      running: this.running,
      taskCount: this.tasks.size,
      tasks: Array.from(this.tasks.entries()).map(([id, { priority }]) => ({
        id,
        priority,
      })),
    };
  }
}

// Export singleton instance
export const animationScheduler = AnimationScheduler.getInstance();
