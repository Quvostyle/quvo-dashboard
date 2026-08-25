// QUVO Studio Local Database Service
// Provides state persistence for Categories, Subcategories, Providers, Rate Cards, Orders, and Lookbooks in localStorage.

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  videos?: string[];
  sortOrder: number;
  isActive: boolean;
  parentId?: string | null;
  created_at: string;
  updated_at: string;
  children?: Category[];
}

export interface Provider {
  id: string;
  full_name: string;
  email: string;
  mobile: string;
  gender: 'male' | 'female' | 'other';
  birth_date: string;
  address: string;
  isActive: boolean;
}

export interface RateCard {
  id: string;
  name: string;
  categoryId: string;
  subcategoryId: string;
  providerId: string;
  price: number;
  strikePrice: number;
  weight: number;
  recommended: boolean;
  bestDeal: boolean;
  active: boolean;
  serviceType: 'b2c' | 'b2b';
  images?: string[];
  videos?: string[];
}

export interface LookbookItem {
  id: string;
  title: string;
  description: string;
  image_url: string;
  product_link?: string;
  price?: string;
  category: 'top' | 'bottom' | 'outerwear' | 'shoes' | 'accessory';
}

export interface Lookbook {
  id: string;
  intake_id: string;
  stylist_user_id: string;
  intro_note: string;
  items: LookbookItem[];
  created_at: string;
  updated_at: string;
}

export interface IntakeRequest {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  occasion: string;
  budget: string | null;
  gender: string;
  style_preference: string;
  body_type: string;
  city: string;
  notes?: string;
  photo_ids: string[];
  status: 'pending' | 'assigned' | 'completed';
  assigned_stylist_id: string | null; // Mapped to providerId
  form_responses?: Record<string, any>;
  created_at: string;
}

// ─── UTILITIES ───────────────────────────────────────────────────────────────

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')   // strip non-alphanumeric
    .replace(/[\s]+/g, '-')          // spaces -> hyphens
    .replace(/-+/g, '-');            // collapse multiple hyphens
}



// Initialize localStorage if keys do not exist
export function initializeDB() {
  const versionKey = 'quvo_db_clean_v1';
  if (!localStorage.getItem(versionKey)) {
    localStorage.removeItem('quvo_categories');
    localStorage.removeItem('quvo_providers');
    localStorage.removeItem('quvo_rate_cards');
    localStorage.removeItem('quvo_orders');
    localStorage.removeItem('quvo_lookbooks');
    localStorage.setItem(versionKey, 'true');
  }

  if (!localStorage.getItem('quvo_categories')) {
    localStorage.setItem('quvo_categories', JSON.stringify([]));
  }

  if (!localStorage.getItem('quvo_providers')) {
    localStorage.setItem('quvo_providers', JSON.stringify([]));
  }

  if (!localStorage.getItem('quvo_rate_cards')) {
    localStorage.setItem('quvo_rate_cards', JSON.stringify([]));
  }

  if (!localStorage.getItem('quvo_orders')) {
    localStorage.setItem('quvo_orders', JSON.stringify([]));
  }

  if (!localStorage.getItem('quvo_lookbooks')) {
    localStorage.setItem('quvo_lookbooks', JSON.stringify([]));
  }
}

// Helper to get raw items
function getStoredItems<T>(key: string): T[] {
  initializeDB();
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

function setStoredItems<T>(key: string, items: T[]): void {
  localStorage.setItem(key, JSON.stringify(items));
}

// ─── CRUD PERSISTENCE ─────────────────────────────────────────────────────────

export const dataService = {
  // --- Categories ---
  getCategories(): Category[] {
    return getStoredItems<Category>('quvo_categories');
  },

  getActiveCategories(): Category[] {
    return this.getCategories().filter(c => c.isActive);
  },

  addCategory(name: string, description?: string, sortOrder: number = 0, parentId: string | null = null): Category {
    const categories = this.getCategories();
    
    // CAP LEVEL: A subcategory cannot itself have children
    if (parentId) {
      const parent = categories.find(c => c.id === parentId);
      if (parent && parent.parentId) {
        throw new Error('Categories cannot exceed 2 levels of hierarchy.');
      }
    }

    const baseSlug = toSlug(name);
    let slug = baseSlug;
    let count = 1;
    while (categories.some(c => c.slug === slug && c.parentId === parentId)) {
      count++;
      slug = `${baseSlug}-${count}`;
    }

    const newCat: Category = {
      id: generateUUID(),
      name,
      slug,
      description,
      sortOrder,
      isActive: true,
      parentId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    categories.push(newCat);
    setStoredItems('quvo_categories', categories);
    return newCat;
  },

  updateCategory(id: string, name?: string, description?: string, sortOrder?: number, isActive?: boolean, parentId?: string | null): Category {
    const categories = this.getCategories();
    const idx = categories.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Category not found.');

    const cat = categories[idx];
    if (name && name !== cat.name) {
      cat.name = name;
      const baseSlug = toSlug(name);
      let slug = baseSlug;
      let count = 1;
      while (categories.some((c, i) => c.slug === slug && c.parentId === cat.parentId && i !== idx)) {
        count++;
        slug = `${baseSlug}-${count}`;
      }
      cat.slug = slug;
    }

    if (description !== undefined) cat.description = description;
    if (sortOrder !== undefined) cat.sortOrder = sortOrder;
    if (parentId !== undefined) cat.parentId = parentId;
    
    if (isActive !== undefined) {
      cat.isActive = isActive;
      // If deactivating a parent category, also deactivate all children subcategories
      if (!isActive && !cat.parentId) {
        categories.forEach(c => {
          if (c.parentId === id) {
            c.isActive = false;
            c.updated_at = new Date().toISOString();
          }
        });
      }
    }

    cat.updated_at = new Date().toISOString();
    categories[idx] = cat;
    setStoredItems('quvo_categories', categories);
    return cat;
  },

  deleteCategory(id: string): void {
    // Soft delete: sets isActive to false
    this.updateCategory(id, undefined, undefined, undefined, false);
  },

  // --- Providers ---
  getProviders(): Provider[] {
    return getStoredItems<Provider>('quvo_providers');
  },

  addProvider(prov: Omit<Provider, 'id'>): Provider {
    const providers = this.getProviders();
    const id = generateUUID();
    const newProv: Provider = {
      ...prov,
      id
    };
    providers.push(newProv);
    setStoredItems('quvo_providers', providers);
    return newProv;
  },

  updateProvider(id: string, updates: Partial<Provider>): Provider {
    const providers = this.getProviders();
    const idx = providers.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Provider not found.');

    const updated = {
      ...providers[idx],
      ...updates
    };
    providers[idx] = updated;
    setStoredItems('quvo_providers', providers);
    return updated;
  },

  deleteProvider(id: string): void {
    // Soft delete / deactivation
    this.updateProvider(id, { isActive: false });
  },

  // --- Rate Cards ---
  getRateCards(providerId?: string): RateCard[] {
    const rc = getStoredItems<RateCard>('quvo_rate_cards');
    if (providerId) {
      return rc.filter(item => item.providerId === providerId);
    }
    return rc;
  },

  addRateCard(rc: Omit<RateCard, 'id'>): RateCard {
    const rateCards = this.getRateCards();
    const id = generateUUID();
    const newRc: RateCard = {
      ...rc,
      id
    };
    rateCards.push(newRc);
    setStoredItems('quvo_rate_cards', rateCards);
    return newRc;
  },

  updateRateCard(id: string, updates: Partial<RateCard>): RateCard {
    const rateCards = this.getRateCards();
    const idx = rateCards.findIndex(r => r.id === id);
    if (idx === -1) throw new Error('Rate card not found.');

    const updated = {
      ...rateCards[idx],
      ...updates
    };
    rateCards[idx] = updated;
    setStoredItems('quvo_rate_cards', rateCards);
    return updated;
  },

  deleteRateCard(id: string): void {
    const rateCards = this.getRateCards();
    const filtered = rateCards.filter(r => r.id !== id);
    setStoredItems('quvo_rate_cards', filtered);
  },

  // --- Orders (Intake Requests) ---
  getOrders(): IntakeRequest[] {
    return getStoredItems<IntakeRequest>('quvo_orders');
  },

  addOrder(order: Omit<IntakeRequest, 'id' | 'created_at' | 'status' | 'assigned_stylist_id'>): IntakeRequest {
    const orders = this.getOrders();
    const newOrder: IntakeRequest = {
      ...order,
      id: `req_${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'pending',
      assigned_stylist_id: null,
      created_at: new Date().toISOString()
    };
    orders.push(newOrder);
    setStoredItems('quvo_orders', orders);
    return newOrder;
  },

  updateOrder(id: string, updates: Partial<IntakeRequest>): IntakeRequest {
    const orders = this.getOrders();
    const idx = orders.findIndex(o => o.id === id);
    if (idx === -1) throw new Error('Order not found.');

    const updated = {
      ...orders[idx],
      ...updates
    };
    orders[idx] = updated;
    setStoredItems('quvo_orders', orders);
    return updated;
  },

  assignStylistToOrder(orderId: string, stylistId: string | null): IntakeRequest {
    const status = stylistId ? 'assigned' : 'pending';
    return this.updateOrder(orderId, {
      assigned_stylist_id: stylistId,
      status: status
    });
  },

  deleteOrder(id: string): void {
    const orders = this.getOrders();
    const filtered = orders.filter(o => o.id !== id);
    setStoredItems('quvo_orders', filtered);
  },

  // --- Lookbooks ---
  getLookbooks(): Lookbook[] {
    return getStoredItems<Lookbook>('quvo_lookbooks');
  },

  getLookbookByIntakeId(intakeId: string): Lookbook | null {
    const lookbooks = this.getLookbooks();
    const o = lookbooks.find(l => l.intake_id === intakeId);
    if (o) return o;

    // Create a new lookbook if it doesn't exist
    const orders = this.getOrders();
    const order = orders.find(ord => ord.id === intakeId);
    if (!order || !order.assigned_stylist_id) return null;

    const newLb: Lookbook = {
      id: `lb_${Math.floor(1000 + Math.random() * 9000)}`,
      intake_id: intakeId,
      stylist_user_id: `stylist_${order.assigned_stylist_id.replace('prov_', '')}`,
      intro_note: `Here is your customized style recommendations compiled for your occasion: ${order.occasion}.`,
      items: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    lookbooks.push(newLb);
    setStoredItems('quvo_lookbooks', lookbooks);
    return newLb;
  },

  saveLookbook(lookbook: Lookbook): Lookbook {
    const lookbooks = this.getLookbooks();
    const idx = lookbooks.findIndex(l => l.id === lookbook.id);
    lookbook.updated_at = new Date().toISOString();
    if (idx !== -1) {
      lookbooks[idx] = lookbook;
    } else {
      lookbooks.push(lookbook);
    }
    setStoredItems('quvo_lookbooks', lookbooks);
    return lookbook;
  },

  addLookbookItem(intakeId: string, item: Omit<LookbookItem, 'id'>): Lookbook {
    const lb = this.getLookbookByIntakeId(intakeId);
    if (!lb) throw new Error('Lookbook not found or cannot be initialized (assign stylist first).');

    const newItem: LookbookItem = {
      ...item,
      id: `item_${Math.floor(1000 + Math.random() * 9000)}`
    };

    lb.items.push(newItem);
    return this.saveLookbook(lb);
  },

  deleteLookbookItem(intakeId: string, itemId: string): Lookbook {
    const lb = this.getLookbookByIntakeId(intakeId);
    if (!lb) throw new Error('Lookbook not found.');

    lb.items = lb.items.filter(item => item.id !== itemId);
    return this.saveLookbook(lb);
  }
};
