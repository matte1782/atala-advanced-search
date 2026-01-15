/**
 * Filter Engine
 * Multi-dimensional product filtering with real-time updates
 */

import type { Product, FilterCriteria } from '@core/types';
import { productService } from './productService';
import { eventBus } from '@core/eventBus';

export class FilterEngine {
  private allProducts: Product[] = [];
  private filteredProducts: Product[] = [];
  private currentFilters: FilterCriteria;

  constructor() {
    this.currentFilters = this.getDefaultFilters();
  }

  /**
   * Initialize with products
   */
  init(products: Product[]): void {
    this.allProducts = products;
    this.filteredProducts = products;
  }

  /**
   * Get default filter state
   */
  private getDefaultFilters(): FilterCriteria {
    const priceRange = productService.getPriceRange();
    return {
      categories: [],
      subcategories: [],
      priceMin: priceRange.min,
      priceMax: priceRange.max,
      motors: [],
      batteries: [],
      gearing: [],
      wheelSizes: [],
      searchQuery: '',
    };
  }

  /**
   * Apply filters and return filtered products
   */
  applyFilters(filters: Partial<FilterCriteria>): Product[] {
    const startTime = performance.now();

    // Merge with current filters
    this.currentFilters = {
      ...this.currentFilters,
      ...filters,
    };

    // Filter products
    this.filteredProducts = this.allProducts.filter((product) => {
      return this.matchesFilters(product, this.currentFilters);
    });

    const duration = performance.now() - startTime;
    console.log(`[FilterEngine] Filtered ${this.filteredProducts.length}/${this.allProducts.length} products in ${duration.toFixed(2)}ms`);

    // Emit event
    eventBus.emit('filter:changed', this.currentFilters);

    return this.filteredProducts;
  }

  /**
   * Check if product matches current filters
   */
  private matchesFilters(product: Product, filters: FilterCriteria): boolean {
    // Category filter
    if (filters.categories.length > 0) {
      if (!filters.categories.includes(product.category.id)) {
        return false;
      }
    }

    // Subcategory filter
    if (filters.subcategories.length > 0) {
      if (!filters.subcategories.includes(product.subcategory.id)) {
        return false;
      }
    }

    // Price range filter
    if (product.price < filters.priceMin || product.price > filters.priceMax) {
      return false;
    }

    // Motor type filter
    if (filters.motors.length > 0) {
      if (!product.motor || !filters.motors.includes(product.motor)) {
        return false;
      }
    }

    // Battery capacity filter
    if (filters.batteries.length > 0) {
      if (!product.battery || !filters.batteries.includes(product.battery)) {
        return false;
      }
    }

    // Gearing filter
    if (filters.gearing.length > 0) {
      if (!product.gearing || !filters.gearing.includes(product.gearing)) {
        return false;
      }
    }

    // Wheel size filter
    if (filters.wheelSizes.length > 0) {
      if (!product.wheelSize || !filters.wheelSizes.includes(product.wheelSize)) {
        return false;
      }
    }

    // Search query filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const searchableText = [
        product.name,
        product.category.name,
        product.subcategory.name,
        product.description || '',
      ].join(' ').toLowerCase();

      if (!searchableText.includes(query)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Update single filter
   */
  updateFilter<K extends keyof FilterCriteria>(
    key: K,
    value: FilterCriteria[K]
  ): Product[] {
    return this.applyFilters({ [key]: value });
  }

  /**
   * Clear all filters
   */
  clearFilters(): Product[] {
    this.currentFilters = this.getDefaultFilters();
    this.filteredProducts = this.allProducts;
    eventBus.emit('filter:changed', this.currentFilters);
    return this.filteredProducts;
  }

  /**
   * Get current filtered products
   */
  getFiltered(): Product[] {
    return this.filteredProducts;
  }

  /**
   * Get current filters
   */
  getCurrentFilters(): FilterCriteria {
    return { ...this.currentFilters };
  }

  /**
   * Get filter statistics
   */
  getStats(): {
    total: number;
    filtered: number;
    percentage: number;
  } {
    return {
      total: this.allProducts.length,
      filtered: this.filteredProducts.length,
      percentage: (this.filteredProducts.length / this.allProducts.length) * 100,
    };
  }

  /**
   * Apply filters to DOM elements (show/hide product cards)
   */
  applyToDOMElements(selector: string = '.product-card'): void {
    const cards = document.querySelectorAll(selector);
    const filteredIds = new Set(this.filteredProducts.map((p) => p.id));

    cards.forEach((card) => {
      const cardElement = card as HTMLElement;
      const productId = cardElement.dataset.id || cardElement.id;

      if (filteredIds.has(productId)) {
        cardElement.style.display = '';
        cardElement.setAttribute('data-filtered', 'true');
      } else {
        cardElement.style.display = 'none';
        cardElement.setAttribute('data-filtered', 'false');
      }
    });

    this.updateResultsCount();
  }

  /**
   * Update results count display
   */
  private updateResultsCount(): void {
    const countElement = document.querySelector('[data-results-count]');
    if (countElement) {
      countElement.textContent = this.filteredProducts.length.toString();
    }

    const totalElement = document.querySelector('[data-results-total]');
    if (totalElement) {
      totalElement.textContent = this.allProducts.length.toString();
    }
  }

  /**
   * Sort filtered products
   */
  sort(
    key: 'name' | 'price' | 'priceOriginal',
    order: 'asc' | 'desc' = 'asc'
  ): Product[] {
    this.filteredProducts.sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return order === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return order === 'asc' ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });

    return this.filteredProducts;
  }
}

// Export singleton instance
export const filterEngine = new FilterEngine();
