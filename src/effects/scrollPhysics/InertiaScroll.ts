/**
 * Hyper-Physical Scroll System
 * Custom inertia scroll with bezier easing and space-time distortion
 */

import { animationScheduler } from '@performance/AnimationScheduler';

export class InertiaScroll {
  private isRunning: boolean = false;
  private isEnabled: boolean = false;

  // Scroll state
  private scrollY: number = 0;
  private targetScrollY: number = 0;
  private velocity: number = 0;

  // Physics parameters
  private friction: number = 0.92;
  private acceleration: number = 0.08;
  private minVelocity: number = 0.01;

  // Bezier easing for non-linear inertia
  private bezierPoints = { x1: 0.22, y1: 0.61, x2: 0.36, y2: 1 };

  // Parallax elements
  private parallaxElements: Map<HTMLElement, number> = new Map();

  constructor() {
    this.bindEvents();
  }

  /**
   * Cubic bezier easing function
   */
  private cubicBezier(t: number): number {
    const { y1, y2 } = this.bezierPoints;
    const cy = 3 * y1;
    const by = 3 * (y2 - y1) - cy;
    const ay = 1 - cy - by;

    const tSquared = t * t;
    const tCubed = tSquared * t;

    return ay * tCubed + by * tSquared + cy * t;
  }

  /**
   * Bind scroll events
   */
  private bindEvents(): void {
    let wheelTimeout: number;
    let lastWheelTime = 0;

    window.addEventListener('wheel', (e) => {
      if (!this.isEnabled) return;

      e.preventDefault();

      const now = performance.now();
      const timeDelta = now - lastWheelTime;
      lastWheelTime = now;

      // Accumulate scroll delta
      const scrollDelta = e.deltaY;

      // Apply momentum based on scroll speed
      const momentumMultiplier = Math.min(timeDelta / 16, 3);
      this.targetScrollY += scrollDelta * momentumMultiplier;

      // Clamp to page bounds
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      this.targetScrollY = Math.max(0, Math.min(this.targetScrollY, maxScroll));

      // Apply velocity for inertia
      this.velocity += scrollDelta * 0.05;

      // Clear existing timeout
      clearTimeout(wheelTimeout);

      // Continue momentum after wheel stops
      wheelTimeout = window.setTimeout(() => {
        this.velocity *= 0.5; // Gradual decay
      }, 100);
    }, { passive: false });

    // Handle native scrollbar (disable when custom scroll active)
    window.addEventListener('scroll', () => {
      if (this.isEnabled) {
        window.scrollTo(0, this.scrollY);
      }
    });

    // Keyboard navigation
    window.addEventListener('keydown', (e) => {
      if (!this.isEnabled) return;

      const scrollAmount = 100;
      switch (e.key) {
        case 'ArrowDown':
        case 'PageDown':
          e.preventDefault();
          this.targetScrollY += scrollAmount;
          break;
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          this.targetScrollY -= scrollAmount;
          break;
        case 'Home':
          e.preventDefault();
          this.targetScrollY = 0;
          break;
        case 'End':
          e.preventDefault();
          this.targetScrollY = document.documentElement.scrollHeight - window.innerHeight;
          break;
      }
    });
  }

  /**
   * Update scroll physics
   */
  private updatePhysics(_dt: number): void {
    // Calculate distance to target
    const delta = this.targetScrollY - this.scrollY;

    // Apply acceleration
    this.velocity += delta * this.acceleration;

    // Apply friction
    this.velocity *= this.friction;

    // Apply bezier easing to velocity
    const normalizedVelocity = Math.abs(this.velocity) / 100;
    const easedVelocity = this.cubicBezier(Math.min(normalizedVelocity, 1));
    this.velocity = this.velocity >= 0 ? easedVelocity * 100 : -easedVelocity * 100;

    // Update position
    this.scrollY += this.velocity;

    // Stop if velocity is minimal
    if (Math.abs(this.velocity) < this.minVelocity && Math.abs(delta) < 1) {
      this.scrollY = this.targetScrollY;
      this.velocity = 0;
    }

    // Apply scroll to window
    window.scrollTo(0, this.scrollY);

    // Update parallax elements
    this.updateParallax();

    // Update product cards with space-time distortion
    this.updateSpaceTimeDistortion();
  }

  /**
   * Update parallax elements
   */
  private updateParallax(): void {
    this.parallaxElements.forEach((speed, element) => {
      const rect = element.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      const distanceFromCenter = centerY - window.innerHeight / 2;

      // Parallax offset based on distance from viewport center
      const parallaxY = distanceFromCenter * speed * 0.001;

      element.style.transform = `translate3d(0, ${parallaxY}px, 0)`;
    });
  }

  /**
   * Space-time distortion effect on product cards
   */
  private updateSpaceTimeDistortion(): void {
    const cards = document.querySelectorAll('.product-card');
    const velocityNormalized = Math.min(Math.abs(this.velocity) / 50, 1);

    cards.forEach((card) => {
      const element = card as HTMLElement;
      const rect = element.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      const distanceFromCenter = Math.abs(centerY - window.innerHeight / 2);
      const maxDistance = window.innerHeight / 2;

      // Calculate distortion based on velocity and distance
      const distortion = (1 - distanceFromCenter / maxDistance) * velocityNormalized;

      // Apply skew and scale
      const skewY = distortion * 5 * (this.velocity > 0 ? 1 : -1);
      const scale = 1 + distortion * 0.05;

      element.style.transform = `
        skewY(${skewY}deg)
        scale(${scale})
        translateZ(0)
      `;

      // Blur based on velocity
      const blur = velocityNormalized * 2;
      element.style.filter = blur > 0.1 ? `blur(${blur}px)` : 'none';
    });
  }

  /**
   * Add parallax element
   */
  addParallaxElement(element: HTMLElement, speed: number = 1): void {
    this.parallaxElements.set(element, speed);
  }

  /**
   * Scroll to element smoothly
   */
  scrollToElement(element: HTMLElement, offset: number = 0): void {
    const rect = element.getBoundingClientRect();
    const absoluteTop = rect.top + window.scrollY;
    this.targetScrollY = absoluteTop - offset;
  }

  /**
   * Animation loop
   */
  private update = (dt: number): void => {
    this.updatePhysics(dt);
  };

  /**
   * Enable custom scroll
   */
  enable(): void {
    if (this.isEnabled) return;

    this.isEnabled = true;
    this.scrollY = window.scrollY;
    this.targetScrollY = window.scrollY;

    // Prevent default scroll
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    this.start();
  }

  /**
   * Disable custom scroll (fallback to native)
   */
  disable(): void {
    if (!this.isEnabled) return;

    this.isEnabled = false;
    this.stop();

    // Restore native scroll
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';

    // Clear transforms
    document.querySelectorAll('.product-card').forEach((card) => {
      (card as HTMLElement).style.transform = '';
      (card as HTMLElement).style.filter = '';
    });

    this.parallaxElements.forEach((_, element) => {
      element.style.transform = '';
    });
  }

  /**
   * Start animation loop
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    animationScheduler.register('inertiaScroll', this.update, 100);
    console.log('[InertiaScroll] Started');
  }

  /**
   * Stop animation loop
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    animationScheduler.unregister('inertiaScroll');
    console.log('[InertiaScroll] Stopped');
  }

  /**
   * Get current scroll position
   */
  getScrollY(): number {
    return this.scrollY;
  }

  /**
   * Get current velocity
   */
  getVelocity(): number {
    return this.velocity;
  }

  /**
   * Check if enabled
   */
  isScrollEnabled(): boolean {
    return this.isEnabled;
  }
}

// Export singleton
export const inertiaScroll = new InertiaScroll();
