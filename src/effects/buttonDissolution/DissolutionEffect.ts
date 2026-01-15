/**
 * WebGL Particle Dissolution Effect
 * 500-particle GPU-instanced dissolution with object pooling
 */

import * as THREE from 'three';
import { Config } from '@core/config';
import { animationScheduler } from '@performance/AnimationScheduler';

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
  color: THREE.Color;
  active: boolean;
}

export class DissolutionEffect {
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private renderer: THREE.WebGLRenderer;
  private particleCount: number = 500;
  private particlePool: Particle[] = [];

  // Instanced mesh for GPU performance
  private instancedMesh: THREE.InstancedMesh | null = null;
  private dummy = new THREE.Object3D();

  private canvas: HTMLCanvasElement;
  private isRunning: boolean = false;
  private activeElements: Map<HTMLElement, number[]> = new Map();

  constructor(particleCount: number = 500) {
    this.particleCount = particleCount;
    this.canvas = this.createCanvas();

    // Setup Three.js scene
    this.scene = new THREE.Scene();
    this.camera = this.setupCamera();
    this.renderer = this.setupRenderer();

    // Create particle system
    this.createParticleSystem();
    this.initializeParticlePool();
  }

  /**
   * Create canvas overlay
   */
  private createCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);
    return canvas;
  }

  /**
   * Setup orthographic camera for 2D overlay
   */
  private setupCamera(): THREE.OrthographicCamera {
    const camera = new THREE.OrthographicCamera(
      0, window.innerWidth,
      0, window.innerHeight,
      0.1, 1000
    );
    camera.position.z = 100;
    return camera;
  }

  /**
   * Setup WebGL renderer
   */
  private setupRenderer(): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    return renderer;
  }

  /**
   * Create GPU-instanced particle system
   */
  private createParticleSystem(): void {
    const geometry = new THREE.PlaneGeometry(4, 4);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide,
    });

    this.instancedMesh = new THREE.InstancedMesh(
      geometry,
      material,
      this.particleCount
    );

    // Initialize all instances as invisible
    for (let i = 0; i < this.particleCount; i++) {
      this.dummy.position.set(0, 0, -1000);
      this.dummy.scale.setScalar(0);
      this.dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(this.instancedMesh);
  }

  /**
   * Initialize particle pool for object reuse
   */
  private initializeParticlePool(): void {
    for (let i = 0; i < this.particleCount; i++) {
      this.particlePool.push({
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: 1,
        size: 3,
        color: new THREE.Color(Config.colors.primary),
        active: false,
      });
    }
  }

  /**
   * Dissolve a DOM element into particles
   */
  dissolve(element: HTMLElement): void {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = window.innerHeight - (rect.top + rect.height / 2);

    // Calculate particle distribution
    const particlesPerElement = Math.min(100, this.particleCount);
    const particleIndices: number[] = [];

    // Get particles from pool
    let allocated = 0;
    for (let i = 0; i < this.particlePool.length && allocated < particlesPerElement; i++) {
      if (!this.particlePool[i].active) {
        const particle = this.particlePool[i];

        // Position particles in element bounds
        const offsetX = (Math.random() - 0.5) * rect.width;
        const offsetY = (Math.random() - 0.5) * rect.height;

        particle.position.set(
          centerX + offsetX,
          centerY + offsetY,
          0
        );

        // Explosive velocity outward
        const angle = Math.random() * Math.PI * 2;
        const speed = 100 + Math.random() * 200;
        particle.velocity.set(
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          0
        );

        particle.life = 1.0;
        particle.maxLife = 1.0;
        particle.size = 3 + Math.random() * 3;
        particle.color.set(Config.colors.primary);
        particle.active = true;

        particleIndices.push(i);
        allocated++;
      }
    }

    this.activeElements.set(element, particleIndices);

    // Hide original element temporarily
    element.style.opacity = '0';

    // Restore after animation
    setTimeout(() => {
      element.style.opacity = '';
    }, 1500);
  }

  /**
   * Update particle physics
   */
  private updatePhysics(dt: number): void {
    const dtSeconds = dt / 1000;

    for (let i = 0; i < this.particlePool.length; i++) {
      const particle = this.particlePool[i];
      if (!particle.active) continue;

      // Apply gravity
      particle.velocity.y -= 200 * dtSeconds;

      // Apply velocity
      particle.position.x += particle.velocity.x * dtSeconds;
      particle.position.y += particle.velocity.y * dtSeconds;

      // Apply air resistance
      particle.velocity.multiplyScalar(0.98);

      // Decrease life
      particle.life -= dtSeconds / particle.maxLife;

      if (particle.life <= 0) {
        particle.active = false;
      }
    }
  }

  /**
   * Render particles to WebGL
   */
  private render(): void {
    if (!this.instancedMesh) return;

    for (let i = 0; i < this.particlePool.length; i++) {
      const particle = this.particlePool[i];

      if (particle.active) {
        // Update instance matrix
        this.dummy.position.copy(particle.position);
        this.dummy.scale.setScalar(particle.size);
        this.dummy.updateMatrix();
        this.instancedMesh.setMatrixAt(i, this.dummy.matrix);

        // Update color with fade out
        const opacity = particle.life;
        this.instancedMesh.setColorAt(
          i,
          new THREE.Color(Config.colors.primary).multiplyScalar(opacity)
        );
      } else {
        // Hide inactive particles
        this.dummy.position.set(0, 0, -1000);
        this.dummy.scale.setScalar(0);
        this.dummy.updateMatrix();
        this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
      }
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true;
    }

    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Animation loop callback
   */
  private update = (dt: number): void => {
    this.updatePhysics(dt);
    this.render();
  };

  /**
   * Start animation loop
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    animationScheduler.register('buttonDissolution', this.update, 90);
    console.log('[DissolutionEffect] Started');
  }

  /**
   * Stop animation loop
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    animationScheduler.unregister('buttonDissolution');
    console.log('[DissolutionEffect] Stopped');
  }

  /**
   * Bind to buttons
   */
  bindToElements(selector: string): void {
    const elements = document.querySelectorAll(selector);
    elements.forEach((el) => {
      el.addEventListener('click', (e) => {
        // Prevent default only for demo purposes
        const target = e.currentTarget as HTMLElement;
        this.dissolve(target);
      });
    });

    console.log(`[DissolutionEffect] Bound to ${elements.length} elements`);
  }

  /**
   * Handle window resize
   */
  resize(): void {
    this.camera.right = window.innerWidth;
    this.camera.bottom = window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  /**
   * Cleanup
   */
  dispose(): void {
    this.stop();

    if (this.instancedMesh) {
      this.instancedMesh.geometry.dispose();
      (this.instancedMesh.material as THREE.Material).dispose();
      this.scene.remove(this.instancedMesh);
    }

    this.renderer.dispose();
    this.canvas.remove();
    this.particlePool = [];
    this.activeElements.clear();
  }

  /**
   * Get active particle count
   */
  getActiveParticleCount(): number {
    return this.particlePool.filter((p) => p.active).length;
  }
}
