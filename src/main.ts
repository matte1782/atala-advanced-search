/**
 * Atala Advanced Search - Main Entry Point
 * Progressive enhancement with device-based effect loading
 */

import { deviceCapabilities, batteryManager } from '@performance/DeviceCapabilities';
import { performanceMonitor } from '@performance/PerformanceMonitor';
import { productService } from '@data/productService';
import { filterEngine } from '@data/filterEngine';
import { TypographyEngine } from '@effects/particleTypography/TypographyEngine';
import { CursorController } from '@effects/magneticCursor/CursorController';
import { DissolutionEffect } from '@effects/buttonDissolution/DissolutionEffect';
import { LiquidMetalMorph } from '@effects/shaderMorphing/LiquidMetalMorph';
import { inertiaScroll } from '@effects/scrollPhysics/InertiaScroll';
import { eventBus } from '@core/eventBus';

/**
 * Main Application Class
 */
class AtalaAdvancedSearch {
  private effects: Map<string, any> = new Map();
  private initialized: boolean = false;

  async init(): Promise<void> {
    if (this.initialized) return;

    console.log('[AtalaAdvancedSearch] Initializing...');
    const startTime = performance.now();

    try {
      // 1. Detect device capabilities
      const caps = deviceCapabilities.detect();
      console.log('[AtalaAdvancedSearch] Device capabilities:', {
        isMobile: caps.isMobile,
        hasWebGL: caps.hasWebGL,
        cpuCores: caps.cpuCores,
        memory: caps.memory,
        tier: caps.isHighEnd ? 'high' : caps.isMidTier ? 'mid' : 'low',
      });

      // 2. Initialize battery monitoring
      await batteryManager.init();

      // 3. Start performance monitoring
      performanceMonitor.start();

      // 4. Load product data
      const products = this.loadProducts();
      console.log(`[AtalaAdvancedSearch] Loaded ${products.length} products`);

      // 5. Initialize filter engine
      filterEngine.init(products);

      // 6. Load effects based on capabilities
      if (caps.prefersReducedMotion) {
        console.log('[AtalaAdvancedSearch] Reduced motion preferred - basic CSS only');
        this.applyBasicAnimations();
      } else if (caps.isHighEnd && !caps.isMobile) {
        console.log('[AtalaAdvancedSearch] Loading FULL effects suite');
        await this.loadFullEffects();
      } else if (caps.isMidTier) {
        console.log('[AtalaAdvancedSearch] Loading SIMPLIFIED effects');
        await this.loadSimplifiedEffects();
      } else {
        console.log('[AtalaAdvancedSearch] Loading MINIMAL effects');
        await this.loadMinimalEffects();
      }

      // 7. Battery-aware performance scaling
      batteryManager.subscribe((profile) => {
        console.log(`[AtalaAdvancedSearch] Power profile changed: ${profile}`);
        this.adaptToPowerProfile(profile);
      });

      // 8. Setup UI interactions
      this.setupUI();

      const duration = performance.now() - startTime;
      console.log(`[AtalaAdvancedSearch] Initialized in ${duration.toFixed(2)}ms`);

      this.initialized = true;

      // Emit load event
      eventBus.emit('effect:loaded', {
        name: 'atalaAdvancedSearch',
        duration,
      });
    } catch (error) {
      console.error('[AtalaAdvancedSearch] Initialization failed:', error);
      this.applyBasicAnimations();
    }
  }

  /**
   * Load products from DOM
   */
  private loadProducts() {
    // Try loading from JSON script tag first
    const scriptData = productService.loadFromDOM('product-data');
    if (scriptData.length > 0) {
      return scriptData;
    }

    // Fallback: load from Webflow collection list
    return productService.loadFromCollectionList('.product-card');
  }

  /**
   * Load full effects suite (high-end desktop)
   */
  private async loadFullEffects(): Promise<void> {
    // Particle Typography on hero title
    const heroTitle = document.querySelector('.search-hero__title');
    if (heroTitle) {
      const typography = new TypographyEngine(
        heroTitle as HTMLElement,
        heroTitle.textContent || 'Trova la tua bicicletta',
        68
      );
      typography.start();
      this.effects.set('typography', typography);
    }

    // Magnetic Cursor on buttons
    const magneticCursor = new CursorController([
      '.btn--primary',
      '.btn--quick-view',
      '.category-btn',
    ]);
    magneticCursor.start();
    this.effects.set('magneticCursor', magneticCursor);

    // WebGL Particle Dissolution (500 particles)
    const dissolution = new DissolutionEffect(500);
    dissolution.bindToElements('.btn--dissolve, .product-card__cta');
    dissolution.start();
    this.effects.set('dissolution', dissolution);

    // Liquid Metal Morphing Shader
    const shaderContainer = document.querySelector('.shader-morph-container');
    if (shaderContainer) {
      const liquidMetal = new LiquidMetalMorph(shaderContainer as HTMLElement);
      liquidMetal.start();
      this.effects.set('liquidMetal', liquidMetal);
    }

    // Hyper-Physical Scroll
    inertiaScroll.enable();
    this.effects.set('inertiaScroll', inertiaScroll);

    // Add parallax to hero elements
    const parallaxElements = document.querySelectorAll('[data-parallax]');
    parallaxElements.forEach((el) => {
      const speed = parseFloat((el as HTMLElement).dataset.parallax || '1');
      inertiaScroll.addParallaxElement(el as HTMLElement, speed);
    });
  }

  /**
   * Load simplified effects (mid-tier)
   */
  private async loadSimplifiedEffects(): Promise<void> {
    // Particle Typography with reduced count
    const heroTitle = document.querySelector('.search-hero__title');
    if (heroTitle) {
      const typography = new TypographyEngine(
        heroTitle as HTMLElement,
        heroTitle.textContent || 'Trova la tua bicicletta',
        52
      );
      typography.start();
      this.effects.set('typography', typography);
    }

    // Magnetic cursor (fewer buttons)
    const magneticCursor = new CursorController(['.btn--primary']);
    magneticCursor.start();
    this.effects.set('magneticCursor', magneticCursor);

    // Reduced particle dissolution (200 particles)
    const dissolution = new DissolutionEffect(200);
    dissolution.bindToElements('.btn--dissolve');
    dissolution.start();
    this.effects.set('dissolution', dissolution);

    // No shader effects or custom scroll on mid-tier
  }

  /**
   * Load minimal effects (mobile/low-end)
   */
  private async loadMinimalEffects(): Promise<void> {
    // CSS-only animations via class
    document.body.classList.add('effects-minimal');
  }

  /**
   * Apply basic CSS animations
   */
  private applyBasicAnimations(): void {
    document.body.classList.add('effects-basic');

    const style = document.createElement('style');
    style.textContent = `
      .effects-basic .search-hero__title {
        animation: fadeInUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .effects-basic .btn--primary:hover {
        transform: scale(1.05);
        transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .effects-basic .product-card {
        animation: fadeIn 0.5s ease-out forwards;
      }

      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Adapt to power profile changes
   */
  private adaptToPowerProfile(profile: 'performance' | 'balanced' | 'battery-saver'): void {
    switch (profile) {
      case 'battery-saver':
        // Disable all effects
        this.effects.forEach((effect) => {
          if (effect.stop) effect.stop();
          if (effect.disable) effect.disable();
        });
        // Disable custom scroll
        if (inertiaScroll.isScrollEnabled()) {
          inertiaScroll.disable();
        }
        break;

      case 'balanced':
        // Keep minimal effects only, disable heavy WebGL
        const toDisable = ['liquidMetal', 'dissolution'];
        toDisable.forEach((name) => {
          const effect = this.effects.get(name);
          if (effect && effect.stop) effect.stop();
          if (effect && effect.dispose) effect.dispose();
        });
        // Disable custom scroll
        if (inertiaScroll.isScrollEnabled()) {
          inertiaScroll.disable();
        }
        break;

      case 'performance':
        // Re-enable all effects
        this.effects.forEach((effect) => {
          if (effect.start) effect.start();
          if (effect.enable) effect.enable();
        });
        // Re-enable custom scroll if it was part of full effects
        const caps = deviceCapabilities.detect();
        if (caps.isHighEnd && !caps.isMobile && !inertiaScroll.isScrollEnabled()) {
          inertiaScroll.enable();
        }
        break;
    }
  }

  /**
   * Setup UI interactions
   */
  private setupUI(): void {
    // Search input
    const searchInput = document.querySelector('#advanced-search-input') as HTMLInputElement;
    if (searchInput) {
      let debounceTimeout: number;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimeout);
        debounceTimeout = window.setTimeout(() => {
          const query = (e.target as HTMLInputElement).value;
          const filtered = filterEngine.updateFilter('searchQuery', query);
          filterEngine.applyToDOMElements();
          console.log(`[Search] Found ${filtered.length} results for "${query}"`);
        }, 300);
      });
    }

    // Category filters
    document.querySelectorAll('[data-filter-category]').forEach((checkbox) => {
      checkbox.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        const categoryId = target.dataset.filterCategory!;
        const currentFilters = filterEngine.getCurrentFilters();

        const categories = target.checked
          ? [...currentFilters.categories, categoryId]
          : currentFilters.categories.filter((id) => id !== categoryId);

        filterEngine.updateFilter('categories', categories);
        filterEngine.applyToDOMElements();
      });
    });

    // Price range slider (if exists)
    const priceMin = document.querySelector('#price-min') as HTMLInputElement;
    const priceMax = document.querySelector('#price-max') as HTMLInputElement;

    if (priceMin && priceMax) {
      const updatePriceFilter = () => {
        filterEngine.applyFilters({
          priceMin: parseInt(priceMin.value),
          priceMax: parseInt(priceMax.value),
        });
        filterEngine.applyToDOMElements();
      };

      priceMin.addEventListener('input', updatePriceFilter);
      priceMax.addEventListener('input', updatePriceFilter);
    }

    // Sort dropdown
    const sortSelect = document.querySelector('#sort-products') as HTMLSelectElement;
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        const value = (e.target as HTMLSelectElement).value;
        const [key, order] = value.split('-') as ['name' | 'price', 'asc' | 'desc'];
        filterEngine.sort(key, order);
        filterEngine.applyToDOMElements();
      });
    }

    // Clear filters button
    const clearBtn = document.querySelector('[data-clear-filters]');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        filterEngine.clearFilters();
        filterEngine.applyToDOMElements();

        // Reset UI
        document.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
          (cb as HTMLInputElement).checked = false;
        });
        if (searchInput) searchInput.value = '';
      });
    }
  }

  /**
   * Destroy and cleanup
   */
  destroy(): void {
    this.effects.forEach((effect) => {
      if (effect.dispose) effect.dispose();
      if (effect.destroy) effect.destroy();
    });
    this.effects.clear();

    performanceMonitor.stop();
    this.initialized = false;
  }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const app = new AtalaAdvancedSearch();
    app.init();

    // Expose to window for debugging
    (window as any).atalaSearch = app;
  });
} else {
  const app = new AtalaAdvancedSearch();
  app.init();

  // Expose to window for debugging
  (window as any).atalaSearch = app;
}
