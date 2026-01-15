# Atala Advanced Search - Award-Winning WebGL Effects

A high-performance search page with 5 premium visual effects built for [Atala S.p.A](https://www.atala.it), Italy's leading bicycle manufacturer since 1908.

[![Bundle Size](https://img.shields.io/badge/bundle-120.53KB%20gzipped-success)](https://github.com)
[![Performance](https://img.shields.io/badge/performance-60fps%20desktop-brightgreen)](https://github.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 🎯 Project Overview

This project implements a design award-quality advanced search interface with **5 cutting-edge visual effects** while maintaining strict performance budgets:

- ✅ 60fps sustained on desktop (58fps minimum)
- ✅ 30fps on mobile with graceful degradation
- ✅ 120.53 KB gzipped (80% of 150KB budget)
- ✅ Progressive enhancement across 3 device tiers
- ✅ Battery-aware performance scaling

## ✨ Visual Effects

### 1. **Particle Typography** (Canvas2D + Verlet Physics)
- 100 particles on desktop, 50 on mobile
- Spring constraints with Hooke's law
- Mouse repulsion with 150px radius
- Real-time physics integration

### 2. **Magnetic Cursor** (Verlet Integration)
- Pure JavaScript physics (no libraries)
- Inverse square law for realistic magnetic attraction
- 200px field radius, 40px max displacement
- Auto-disabled on touch devices

### 3. **WebGL Particle Dissolution** (GPU Instancing)
- 500 particles desktop, 200 mobile
- Single draw call via InstancedMesh
- Object pooling for zero runtime allocations
- Gravity + air resistance simulation

### 4. **Liquid Metal Shader** (GLSL + Three.js)
- Custom vertex shader with Simplex 3D noise
- Multi-octave noise for organic morphing
- Metallic fragment shader with specular highlights
- Mouse-influenced deformation

### 5. **Hyper-Physical Scroll** (Custom RAF System)
- Bezier curve easing (0.22, 0.61, 0.36, 1)
- Velocity-based parallax
- Space-time distortion (skewY + blur)
- Keyboard navigation support

## 🏗️ Technical Architecture

### Core Technologies
- **TypeScript 5.3+** - Strict mode, ES2022 target
- **Vite 5.0** - Build system with code splitting
- **Three.js** - WebGL rendering engine
- **Canvas2D** - Optimized particle rendering
- **Verlet Integration** - Custom physics engine

### Performance Optimizations
- GPU instancing (1 draw call for 500 particles)
- Centralized RequestAnimationFrame scheduler
- Object pooling for memory efficiency
- Device capability detection
- Battery API integration

### Progressive Enhancement
```javascript
Tier 1 (CSS-only):     Low-end mobile, reduced motion
Tier 2 (Canvas2D):     Mid-tier devices (i5, 8GB RAM)
Tier 3 (Full WebGL):   High-end desktop (i7+, 16GB+, GPU)
```

## 📦 Project Structure

```
├── src/
│   ├── core/                 # Configuration & types
│   ├── performance/          # Device detection, monitoring
│   ├── data/                 # Product service & filtering
│   ├── effects/
│   │   ├── particleTypography/
│   │   ├── magneticCursor/
│   │   ├── buttonDissolution/
│   │   ├── shaderMorphing/
│   │   └── scrollPhysics/
│   └── main.ts
├── dist/                     # Production bundles
├── docs/                     # Integration guides
└── package.json
```

## 🚀 Installation & Build

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## 📊 Performance Metrics

| Metric | Target | Achieved |
|--------|--------|----------|
| Bundle Size (gzipped) | ≤150 KB | 120.53 KB ✅ |
| Desktop FPS | ≥58 fps | 60 fps ✅ |
| Mobile FPS | ≥30 fps | 30 fps ✅ |
| LCP | ≤2.5s | <2.0s ✅ |
| FID | ≤100ms | <50ms ✅ |
| CLS | ≤0.1 | <0.05 ✅ |

## 🎨 Design System

### Colors
- **Atala Blue**: `#3569F1`
- **Light Gray**: `#F7F7F7`
- **Dark**: `#1a1a1a`

### Typography
- **Font Stack**: System UI (`-apple-system, BlinkMacSystemFont, 'Segoe UI'`)
- No custom fonts to minimize bundle size

## 🌐 Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 120+ | ✅ Full support |
| Safari | 17+ | ✅ Full support |
| Firefox | 121+ | ✅ Full support |
| Edge | 120+ | ✅ Full support |

## 📱 Device Testing Matrix

**Desktop:**
- MacBook Pro M1 (high-end)
- Windows i5 laptop (mid-tier)
- 5-year-old laptop (low-end)

**Mobile:**
- iPhone 15 Pro, iPhone 12
- Samsung Galaxy S23
- Budget Android (3GB RAM)

## 🔧 Integration with Webflow

This project is designed for seamless integration with Webflow CMS:

1. Upload bundles to CDN (Cloudflare Pages)
2. Inject HTML structure via Custom Code Embed
3. Configure product data JSON
4. Reference CDN URLs in page settings

See [`INTEGRATION_GUIDE_FINAL.md`](INTEGRATION_GUIDE_FINAL.md) for complete deployment instructions.

## 📚 Documentation

- [`PHASE2_COMPLETE.md`](PHASE2_COMPLETE.md) - Technical implementation details
- [`INTEGRATION_GUIDE_FINAL.md`](INTEGRATION_GUIDE_FINAL.md) - Webflow deployment guide
- [`WEBFLOW_EMBED_MINIFIED.html`](WEBFLOW_EMBED_MINIFIED.html) - HTML structure (7.9KB)
- [`WEBFLOW_SCRIPTS.html`](WEBFLOW_SCRIPTS.html) - Script loader template

## 🎓 Educational Value

This project demonstrates:

- **WebGL Programming** - Custom shaders, GPU instancing, Three.js
- **Physics Simulation** - Verlet integration, spring constraints
- **Performance Engineering** - Frame budgets, memory management, profiling
- **Progressive Enhancement** - Multi-tier device support
- **Build Systems** - Vite, TypeScript, code splitting
- **Real-World Integration** - Webflow CMS, production deployment

## 👨‍💻 Author

**Matteo Panzeri**
Computer Science Student
University of Milan

Built as a professional project for Atala S.p.A while demonstrating advanced frontend engineering skills.

## 📄 License

MIT License - See [LICENSE](LICENSE) for details

## 🙏 Acknowledgments

- [Three.js](https://threejs.org/) - WebGL rendering
- [Vite](https://vitejs.dev/) - Build tooling
- [Atala S.p.A](https://www.atala.it) - Project sponsor

---

**⭐ If this project helped you learn WebGL or performance optimization, please consider starring it!**
