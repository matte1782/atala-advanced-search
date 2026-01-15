/**
 * Magnetic Cursor Controller
 * Buttons attracted to cursor using Verlet integration
 */

import { Vector2 } from '@core/types';
import { Config } from '@core/config';
import { animationScheduler } from '@performance/AnimationScheduler';

class MagneticButton {
  private element: HTMLElement;
  private position: Vector2;
  private oldPosition: Vector2;
  private restPosition: Vector2;
  private isHovered: boolean = false;

  // Physics parameters from config
  private readonly config = Config.effects.magneticCursor;

  constructor(element: HTMLElement) {
    this.element = element;

    const rect = element.getBoundingClientRect();
    this.restPosition = new Vector2(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2
    );
    this.position = this.restPosition.clone();
    this.oldPosition = this.restPosition.clone();

    this.bindEvents();
  }

  private bindEvents(): void {
    this.element.addEventListener('mouseenter', () => {
      this.isHovered = true;
      this.element.style.transition = 'none';
    });

    this.element.addEventListener('mouseleave', () => {
      this.isHovered = false;
    });
  }

  updatePhysics(mousePos: Vector2, _dt: number): void {
    // Verlet integration
    const velocity = this.position.subtract(this.oldPosition);
    this.oldPosition = this.position.clone();

    // Calculate forces
    let forces = new Vector2(0, 0);

    // 1. Spring force back to rest position
    const toRest = this.restPosition.subtract(this.position);
    const springForce = toRest.multiply(this.config.springStrength);
    forces = forces.add(springForce);

    // 2. Magnetic attraction to cursor
    const toCursor = mousePos.subtract(this.position);
    const distanceToCursor = toCursor.length();

    if (distanceToCursor < this.config.radius && distanceToCursor > 0) {
      // Inverse square law for magnetic feel
      const strength = Math.pow(
        1 - distanceToCursor / this.config.radius,
        2
      );
      const magneticForce = toCursor
        .normalize()
        .multiply(this.config.strength * strength);
      forces = forces.add(magneticForce);
    }

    // 3. Extra pull when hovered
    if (this.isHovered && distanceToCursor > 0) {
      const hoverPull = toCursor.multiply(0.2);
      forces = forces.add(hoverPull);
    }

    // Apply Verlet integration with damping
    this.position = this.position
      .add(velocity.multiply(this.config.damping))
      .add(forces);

    // Constrain displacement
    const displacement = this.position.subtract(this.restPosition);
    const displacementLength = displacement.length();

    if (displacementLength > this.config.maxDisplacement) {
      const constrained = displacement
        .normalize()
        .multiply(this.config.maxDisplacement);
      this.position = this.restPosition.add(constrained);
    }

    // Apply transform
    this.applyTransform(mousePos, distanceToCursor);
  }

  private applyTransform(_mousePos: Vector2, distanceToCursor: number): void {
    const offset = this.position.subtract(this.restPosition);

    // Base translation
    let transform = `translate(${offset.x}px, ${offset.y}px)`;

    // Scale based on magnetic proximity
    if (distanceToCursor < this.config.radius) {
      const scaleStrength = 1 - distanceToCursor / this.config.radius;
      const scale = 1 + scaleStrength * 0.1;
      transform += ` scale(${scale})`;
    }

    this.element.style.transform = transform;
  }

  updateRestPosition(): void {
    const rect = this.element.getBoundingClientRect();
    this.restPosition.set(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2
    );
  }

  destroy(): void {
    this.element.style.transform = '';
    this.element.style.transition = '';
  }
}

export class CursorController {
  private buttons: MagneticButton[] = [];
  private mousePosition: Vector2 = new Vector2(0, 0);
  private isRunning: boolean = false;

  constructor(buttonSelectors: string[] = ['.btn--primary', '.btn--quick-view']) {
    this.init(buttonSelectors);
  }

  private init(selectors: string[]): void {
    // Track mouse globally
    document.addEventListener('mousemove', (e) => {
      this.mousePosition.set(e.clientX, e.clientY);
    });

    // Find and initialize magnetic buttons
    selectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((el) => {
        this.buttons.push(new MagneticButton(el as HTMLElement));
      });
    });

    console.log(`[CursorController] Initialized ${this.buttons.length} magnetic buttons`);

    // Handle window resize
    let resizeTimeout: number;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(() => {
        this.buttons.forEach((btn) => btn.updateRestPosition());
      }, 250);
    });
  }

  private update = (dt: number): void => {
    for (const button of this.buttons) {
      button.updatePhysics(this.mousePosition, dt);
    }
  };

  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    animationScheduler.register('magneticCursor', this.update, 70);
    console.log('[CursorController] Started');
  }

  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    animationScheduler.unregister('magneticCursor');
    console.log('[CursorController] Stopped');
  }

  destroy(): void {
    this.stop();
    this.buttons.forEach((btn) => btn.destroy());
    this.buttons = [];
  }

  addButton(element: HTMLElement): void {
    this.buttons.push(new MagneticButton(element));
  }

  getButtonCount(): number {
    return this.buttons.length;
  }
}
