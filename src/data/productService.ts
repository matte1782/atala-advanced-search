/**
 * Product Data Service
 * Loads and caches product data from DOM or JSON
 */

import type { Product } from '@core/types';

export class ProductService {
  private products: Product[] = [];
  private productsById: Map<string, Product> = new Map();
  private productsByCategory: Map<string, Product[]> = new Map();
  private loaded: boolean = false;

  /**
   * Load product data from inline JSON script tag
   */
  loadFromDOM(scriptId: string = 'product-data'): Product[] {
    if (this.loaded) {
      return this.products;
    }

    const script = document.getElementById(scriptId);
    if (!script || script.tagName !== 'SCRIPT') {
      console.error(`[ProductService] Script element "${scriptId}" not found`);
      return [];
    }

    try {
      const data = JSON.parse(script.textContent || '[]');
      this.products = this.normalizeProducts(data);
      this.buildIndexes();
      this.loaded = true;

      console.log(`[ProductService] Loaded ${this.products.length} products`);
      return this.products;
    } catch (error) {
      console.error('[ProductService] Failed to parse product data:', error);
      return [];
    }
  }

  /**
   * Load product data from Webflow Collection List in DOM
   */
  loadFromCollectionList(selector: string = '.product-card'): Product[] {
    if (this.loaded) {
      return this.products;
    }

    const cards = document.querySelectorAll(selector);
    if (cards.length === 0) {
      console.warn(`[ProductService] No product cards found with selector "${selector}"`);
      return [];
    }

    this.products = Array.from(cards).map((card) => this.parseCardData(card as HTMLElement));
    this.buildIndexes();
    this.loaded = true;

    console.log(`[ProductService] Loaded ${this.products.length} products from DOM`);
    return this.products;
  }

  /**
   * Parse product data from a Webflow card element
   */
  private parseCardData(card: HTMLElement): Product {
    const id = card.dataset.id || card.id || '';
    const name = card.dataset.name || card.querySelector('.product-card-title')?.textContent?.trim() || '';
    const slug = card.dataset.slug || '';

    const categoryId = card.dataset.categoryId || '';
    const categoryName = card.dataset.category || '';

    const subcategoryId = card.dataset.subcategoryId || '';
    const subcategoryName = card.dataset.subcategory || '';

    const price = parseFloat(card.dataset.price || '0');
    const priceOriginal = parseFloat(card.dataset.priceOriginal || card.dataset.price || '0');

    const motor = card.dataset.motor || undefined;
    const battery = card.dataset.battery || undefined;
    const gearing = card.dataset.gearing || undefined;
    const wheelSize = card.dataset.wheelSize || undefined;

    const imageEl = card.querySelector('.product-card-image') as HTMLImageElement;
    const image = imageEl?.src || imageEl?.dataset.src || '';
    const imageDetail = card.dataset.imageDetail || undefined;

    const description = card.dataset.description || undefined;

    return {
      id,
      name,
      slug,
      category: {
        id: categoryId,
        name: categoryName,
      },
      subcategory: {
        id: subcategoryId,
        name: subcategoryName,
      },
      price,
      priceOriginal,
      motor,
      battery,
      gearing,
      wheelSize,
      image,
      imageDetail,
      description,
    };
  }

  /**
   * Normalize product data from various formats
   */
  private normalizeProducts(data: any[]): Product[] {
    return data.map((item) => ({
      id: item.id || item._id || '',
      name: item.name || item.title || '',
      slug: item.slug || '',
      category: {
        id: item.category?.id || item.categoryId || '',
        name: item.category?.name || item.categoryName || '',
      },
      subcategory: {
        id: item.subcategory?.id || item.subcategoryId || '',
        name: item.subcategory?.name || item.subcategoryName || '',
      },
      price: parseFloat(item.price || item.prezzoOriginale || '0'),
      priceOriginal: parseFloat(item.priceOriginal || item.prezzoOriginale || '0'),
      motor: item.motor || item.tipologiaKit || undefined,
      battery: item.battery || undefined,
      gearing: item.gearing || item.velocitaMarce || undefined,
      wheelSize: item.wheelSize || item.diametroRuota || undefined,
      image: item.image || item.immaginCopertina || '',
      imageDetail: item.imageDetail || item.immagineDettaglio1 || undefined,
      description: item.description || item.descrizioneBreve || undefined,
    }));
  }

  /**
   * Build lookup indexes for fast filtering
   */
  private buildIndexes(): void {
    this.productsById.clear();
    this.productsByCategory.clear();

    for (const product of this.products) {
      // By ID
      this.productsById.set(product.id, product);

      // By Category
      if (!this.productsByCategory.has(product.category.id)) {
        this.productsByCategory.set(product.category.id, []);
      }
      this.productsByCategory.get(product.category.id)!.push(product);
    }
  }

  /**
   * Get all products
   */
  getAll(): Product[] {
    return this.products;
  }

  /**
   * Get product by ID
   */
  getById(id: string): Product | undefined {
    return this.productsById.get(id);
  }

  /**
   * Get products by category
   */
  getByCategory(categoryId: string): Product[] {
    return this.productsByCategory.get(categoryId) || [];
  }

  /**
   * Get unique categories
   */
  getCategories(): Array<{ id: string; name: string; count: number }> {
    const categories = new Map<string, { name: string; count: number }>();

    for (const product of this.products) {
      const { id, name } = product.category;
      if (!categories.has(id)) {
        categories.set(id, { name, count: 0 });
      }
      categories.get(id)!.count++;
    }

    return Array.from(categories.entries()).map(([id, { name, count }]) => ({
      id,
      name,
      count,
    }));
  }

  /**
   * Get unique subcategories
   */
  getSubcategories(categoryId?: string): Array<{ id: string; name: string; count: number }> {
    const subcategories = new Map<string, { name: string; count: number }>();

    const products = categoryId ? this.getByCategory(categoryId) : this.products;

    for (const product of products) {
      const { id, name } = product.subcategory;
      if (id) {
        if (!subcategories.has(id)) {
          subcategories.set(id, { name, count: 0 });
        }
        subcategories.get(id)!.count++;
      }
    }

    return Array.from(subcategories.entries()).map(([id, { name, count }]) => ({
      id,
      name,
      count,
    }));
  }

  /**
   * Get price range
   */
  getPriceRange(): { min: number; max: number } {
    if (this.products.length === 0) {
      return { min: 0, max: 10000 };
    }

    const prices = this.products.map((p) => p.price).filter((p) => p > 0);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }

  /**
   * Get unique motor types
   */
  getMotorTypes(): string[] {
    const motors = new Set<string>();
    for (const product of this.products) {
      if (product.motor) {
        motors.add(product.motor);
      }
    }
    return Array.from(motors).sort();
  }

  /**
   * Get unique battery capacities
   */
  getBatteryCapacities(): string[] {
    const batteries = new Set<string>();
    for (const product of this.products) {
      if (product.battery) {
        batteries.add(product.battery);
      }
    }
    return Array.from(batteries).sort();
  }

  /**
   * Get unique gearing options
   */
  getGearingOptions(): string[] {
    const gearing = new Set<string>();
    for (const product of this.products) {
      if (product.gearing) {
        gearing.add(product.gearing);
      }
    }
    return Array.from(gearing).sort();
  }

  /**
   * Get unique wheel sizes
   */
  getWheelSizes(): string[] {
    const sizes = new Set<string>();
    for (const product of this.products) {
      if (product.wheelSize) {
        sizes.add(product.wheelSize);
      }
    }
    return Array.from(sizes).sort();
  }

  /**
   * Check if data is loaded
   */
  isLoaded(): boolean {
    return this.loaded;
  }

  /**
   * Get product count
   */
  getCount(): number {
    return this.products.length;
  }
}

// Export singleton instance
export const productService = new ProductService();
