/**
 * Particle Typography Engine
 * Generative typography with spring physics and mouse repulsion
 */

import { Vector2, type TypographyParticle } from '@core/types';
import { Config } from '@core/config';
import { animationScheduler } from '@performance/AnimationScheduler';
import { deviceCapabilities } from '@performance/DeviceCapabilities';

export class TypographyEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: TypographyParticle[] = [];
  private mousePosition: Vector2 = new Vector2(-999, -999);
  private targetText: string;
  private fontSize: number;
  private isRunning: boolean = false;

  // Physics parameters
  private readonly config = Config.effects.particleTypography;
  private particleCount: number;

  constructor(targetElement: HTMLElement, text: string, fontSize: number = 68) {
    this.targetText = text;
    this.fontSize = fontSize;

    // Adjust particle count based on device
    const caps = deviceCapabilities.detect();
    this.particleCount = caps.isMobile
      ? this.config.countMobile
      : this.config.countDesktop;

    this.canvas = this.setupCanvas(targetElement);
    this.ctx = this.canvas.getContext('2d')!;

    this.generateParticlesFromText();
    this.bindEvents();
  }

  /**
   * Setup canvas element
   */
  private setupCanvas(container: HTMLElement): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const rect = container.getBoundingClientRect();

    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';

    // Scale context for retina displays
    this.ctx?.scale(window.devicePixelRatio, window.devicePixelRatio);

    container.style.position = 'relative';
    container.appendChild(canvas);

    return canvas;
  }

  /**
   * Generate particles from text
   */
  private generateParticlesFromText(): void {
    // Create temporary canvas to render text
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d')!;

    // Set canvas size
    tempCanvas.width = this.canvas.width;
    tempCanvas.height = this.canvas.height;

    // Render text
    tempCtx.font = `${this.fontSize}px ${Config.fonts.system}`;
    tempCtx.fillStyle = Config.colors.dark;
    tempCtx.textAlign = 'center';
    tempCtx.textBaseline = 'middle';

    const x = tempCanvas.width / (2 * window.devicePixelRatio);
    const y = tempCanvas.height / (2 * window.devicePixelRatio);
    tempCtx.fillText(this.targetText, x, y);

    // Sample pixels to create particles
    const imageData = tempCtx.getImageData(
      0,
      0,
      tempCanvas.width,
      tempCanvas.height
    );

    const samplingRate = Math.ceil(
      Math.sqrt(
        (imageData.width * imageData.height) / this.particleCount
      )
    );

    const samples: Vector2[] = [];

    for (let y = 0; y < imageData.height; y += samplingRate) {
      for (let x = 0; x < imageData.width; x += samplingRate) {
        const index = (y * imageData.width + x) * 4;
        const alpha = imageData.data[index + 3];

        if (alpha > 128) {
          samples.push(
            new Vector2(
              x / window.devicePixelRatio,
              y / window.devicePixelRatio
            )
          );
        }
      }
    }

    // Randomly select particles to match target count
    while (samples.length > this.particleCount) {
      const randomIndex = Math.floor(Math.random() * samples.length);
      samples.splice(randomIndex, 1);
    }

    // Create particle objects
    this.particles = samples.map((pos) => ({
      position: pos.clone(),
      oldPosition: pos.clone(),
      acceleration: new Vector2(0, 0),
      mass: 1,
      homePosition: pos.clone(),
      life: 1,
      maxLife: 1,
      size: 2,
      opacity: 1,
      active: true,
    }));

    console.log(`[TypographyEngine] Generated ${this.particles.length} particles`);
  }

  /**
   * Bind mouse events
   */
  private bindEvents(): void {
    const updateMouse = (e: MouseEvent) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mousePosition.set(
        e.clientX - rect.left,
        e.clientY - rect.top
      );
    };

    document.addEventListener('mousemove', updateMouse);
    document.addEventListener('mouseleave', () => {
      this.mousePosition.set(-999, -999);
    });
  }

  /**
   * Update physics (Verlet integration)
   */
  private updatePhysics(dt: number): void {
    const dtSeconds = dt / 1000;
    const dtSquared = dtSeconds * dtSeconds;

    for (const particle of this.particles) {
      // Calculate velocity from Verlet
      const velocity = particle.position.subtract(particle.oldPosition);
      particle.oldPosition = particle.position.clone();

      // Spring force back to home position
      const toHome = particle.homePosition.subtract(particle.position);
      const springForce = toHome.multiply(this.config.springStrength);
      particle.acceleration = springForce;

      // Mouse repulsion
      const toMouse = particle.position.subtract(this.mousePosition);
      const distance = toMouse.length();

      if (distance < this.config.mouseInfluenceRadius && distance > 0) {
        const strength =
          (1 - distance / this.config.mouseInfluenceRadius) ** 2;
        const repulsion = toMouse
          .normalize()
          .multiply(this.config.mouseRepulsionForce * strength);
        particle.acceleration = particle.acceleration.add(repulsion);
      }

      // Verlet integration
      particle.position = particle.position
        .add(velocity.multiply(this.config.springDamping))
        .add(particle.acceleration.multiply(dtSquared));
    }
  }

  /**
   * Render particles to canvas
   */
  private render(): void {
    // Clear canvas
    this.ctx.clearRect(
      0,
      0,
      this.canvas.width / window.devicePixelRatio,
      this.canvas.height / window.devicePixelRatio
    );

    // Render particles
    this.ctx.fillStyle = Config.colors.primary;

    for (const particle of this.particles) {
      // Calculate opacity based on velocity
      const velocity = particle.position
        .subtract(particle.oldPosition)
        .length();
      const opacity = Math.min(1, 0.3 + velocity * 0.1);

      this.ctx.globalAlpha = opacity;
      this.ctx.fillRect(
        particle.position.x - 1,
        particle.position.y - 1,
        2,
        2
      );
    }

    this.ctx.globalAlpha = 1;
  }

  /**
   * Animation loop callback
   */
  private update = (dt: number): void => {
    this.updatePhysics(dt);
    this.render();
  };

  /**
   * Start animation
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    animationScheduler.register('particleTypography', this.update, 80);
    console.log('[TypographyEngine] Started');
  }

  /**
   * Stop animation
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    animationScheduler.unregister('particleTypography');
    console.log('[TypographyEngine] Stopped');
  }

  /**
   * Cleanup
   */
  dispose(): void {
    this.stop();
    this.canvas.remove();
    this.particles = [];
  }

  /**
   * Resize canvas
   */
  resize(width: number, height: number): void {
    this.canvas.width = width * window.devicePixelRatio;
    this.canvas.height = height * window.devicePixelRatio;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Regenerate particles
    this.generateParticlesFromText();
  }
}
