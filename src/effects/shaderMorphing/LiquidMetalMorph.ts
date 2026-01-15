/**
 * Liquid Metal Morphing Effect
 * GLSL shaders for mesh distortion with metallic appearance
 */

import * as THREE from 'three';
import { Config } from '@core/config';
import { animationScheduler } from '@performance/AnimationScheduler';

/**
 * Vertex Shader - Multi-octave Simplex Noise Distortion
 */
const vertexShader = `
uniform float uTime;
uniform float uMorphStrength;
uniform vec2 uMousePosition;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

// Simplex 3D Noise
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);

  vec3 pos = position;

  // Multi-octave noise for liquid metal effect
  float noise1 = snoise(vec3(pos.x * 0.5 + uTime * 0.3, pos.y * 0.5, pos.z * 0.5));
  float noise2 = snoise(vec3(pos.x * 1.0 + uTime * 0.5, pos.y * 1.0, pos.z * 1.0)) * 0.5;
  float noise3 = snoise(vec3(pos.x * 2.0 + uTime * 0.7, pos.y * 2.0, pos.z * 2.0)) * 0.25;

  float displacement = (noise1 + noise2 + noise3) * uMorphStrength;

  // Apply displacement along normal
  pos += normal * displacement;

  // Mouse influence
  float distToMouse = length(uMousePosition - pos.xy);
  float mouseInfluence = smoothstep(200.0, 0.0, distToMouse);
  pos += normal * mouseInfluence * 10.0;

  vPosition = pos;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

/**
 * Fragment Shader - Metallic Appearance with Specular
 */
const fragmentShader = `
uniform vec3 uColor;
uniform float uTime;
uniform float uMetallic;
uniform float uRoughness;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  vec3 normal = normalize(vNormal);

  // Fake environment reflection
  vec3 viewDir = normalize(cameraPosition - vPosition);
  float fresnel = pow(1.0 - dot(viewDir, normal), 3.0);

  // Metallic base color
  vec3 baseColor = uColor;

  // Animated highlights
  float highlight = sin(vPosition.x * 0.1 + uTime * 2.0) * 0.5 + 0.5;
  highlight += sin(vPosition.y * 0.1 + uTime * 1.5) * 0.3;

  // Specular reflection
  vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
  vec3 reflectDir = reflect(-lightDir, normal);
  float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);

  // Combine effects
  vec3 color = baseColor * (0.6 + highlight * 0.4);
  color += vec3(1.0) * spec * uMetallic;
  color += vec3(0.8, 0.9, 1.0) * fresnel * 0.3;

  gl_FragColor = vec4(color, 1.0);
}
`;

export class LiquidMetalMorph {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private mesh: THREE.Mesh | null = null;
  private material: THREE.ShaderMaterial | null = null;

  private canvas: HTMLCanvasElement;
  private container: HTMLElement;
  private isRunning: boolean = false;

  private mousePosition = new THREE.Vector2(0, 0);
  private clock = new THREE.Clock();

  constructor(container: HTMLElement) {
    this.container = container;
    this.canvas = this.createCanvas();

    // Setup Three.js
    this.scene = new THREE.Scene();
    this.camera = this.setupCamera();
    this.renderer = this.setupRenderer();

    // Create morphing mesh
    this.createMorphMesh();

    // Mouse tracking
    this.bindMouseEvents();

    // Handle resize
    window.addEventListener('resize', () => this.resize());
  }

  /**
   * Create canvas for WebGL
   */
  private createCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    this.container.appendChild(canvas);
    return canvas;
  }

  /**
   * Setup camera
   */
  private setupCamera(): THREE.PerspectiveCamera {
    const rect = this.container.getBoundingClientRect();
    const camera = new THREE.PerspectiveCamera(
      45,
      rect.width / rect.height,
      0.1,
      1000
    );
    camera.position.z = 300;
    return camera;
  }

  /**
   * Setup renderer
   */
  private setupRenderer(): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
    });

    const rect = this.container.getBoundingClientRect();
    renderer.setSize(rect.width, rect.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    return renderer;
  }

  /**
   * Create morphing mesh with shader material
   */
  private createMorphMesh(): void {
    // Sphere geometry for liquid metal blob
    const geometry = new THREE.SphereGeometry(80, 64, 64);

    // Shader material
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uMorphStrength: { value: 15.0 },
        uColor: { value: new THREE.Color(Config.colors.primary) },
        uMetallic: { value: 0.8 },
        uRoughness: { value: 0.2 },
        uMousePosition: { value: this.mousePosition },
      },
      vertexShader,
      fragmentShader,
      side: THREE.DoubleSide,
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.scene.add(this.mesh);
  }

  /**
   * Bind mouse events for interaction
   */
  private bindMouseEvents(): void {
    this.container.addEventListener('mousemove', (e) => {
      const rect = this.container.getBoundingClientRect();
      this.mousePosition.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mousePosition.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this.mousePosition.x *= rect.width / 2;
      this.mousePosition.y *= rect.height / 2;
    });
  }

  /**
   * Animation loop
   */
  private update = (_dt: number): void => {
    if (!this.material || !this.mesh) return;

    // Update shader uniforms
    this.material.uniforms.uTime.value = this.clock.getElapsedTime();
    this.material.uniforms.uMousePosition.value = this.mousePosition;

    // Rotate mesh slowly
    this.mesh.rotation.x += 0.001;
    this.mesh.rotation.y += 0.002;

    // Render
    this.renderer.render(this.scene, this.camera);
  };

  /**
   * Start animation
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.clock.start();
    animationScheduler.register('liquidMetalMorph', this.update, 95);
    console.log('[LiquidMetalMorph] Started');
  }

  /**
   * Stop animation
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    animationScheduler.unregister('liquidMetalMorph');
    console.log('[LiquidMetalMorph] Stopped');
  }

  /**
   * Handle resize
   */
  resize(): void {
    const rect = this.container.getBoundingClientRect();
    this.camera.aspect = rect.width / rect.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(rect.width, rect.height);
  }

  /**
   * Update morph strength
   */
  setMorphStrength(strength: number): void {
    if (this.material) {
      this.material.uniforms.uMorphStrength.value = strength;
    }
  }

  /**
   * Cleanup
   */
  dispose(): void {
    this.stop();

    if (this.mesh) {
      this.mesh.geometry.dispose();
      if (this.material) this.material.dispose();
      this.scene.remove(this.mesh);
    }

    this.renderer.dispose();
    this.canvas.remove();
  }
}
