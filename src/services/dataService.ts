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

// ─── INITIALIZATION DATA ──────────────────────────────────────────────────────

const INITIAL_CATEGORY_GROUPS = [
  {
    name: "Style",
    description: "Find your aesthetic",
    categories: [
      "Quiet Luxury", "Minimalist", "Contemporary Chic", "Streetwear",
      "Classic & Formal", "Bohemian", "Romantic Feminine",
      "Edgy & Avant-Garde", "Glamour & Evening", "Sustainable Fashion",
    ],
  },
  {
    name: "Occasion",
    description: "Dress the moment",
    categories: [
      "Wedding Guest", "Bridal", "Reception", "Cocktail Party",
      "Vacation", "Honeymoon", "Corporate & Business",
      "Date Night", "Festive", "Photoshoot",
      "Content Creator", "Red Carpet",
    ],
  },
  {
    name: "For",
    description: "Styling by demographic",
    categories: [
      "Women's Fashion", "Men's Fashion", "Teen", "Plus Size",
      "Maternity", "Mature & Elegant",
    ],
  },
  {
    name: "Lifestyle",
    description: "How you live",
    categories: [
      "Corporate Professional", "Entrepreneur & Founder", "Creative Professional",
      "Luxury Lifestyle", "Frequent Traveler", "Socialite & Events", "Influencer & Creator",
    ],
  },
  {
    name: "Budget",
    description: "Tier of service",
    categories: [
      "Affordable (₹2k–₹5k)", "Premium (₹5k–₹15k)",
      "Luxury (₹15k+)", "Ultra Luxury Concierge (₹50k+)",
    ],
  },
  {
    name: "Expertise",
    description: "Specialist services",
    categories: [
      "Personal Shopper", "Wardrobe Audit", "Color Analysis",
      "Body Shape Specialist", "Luxury Fashion Consultant",
      "Sustainable Fashion Consultant", "Bridal Fashion Expert", "Image Consultant",
    ],
  },
  {
    name: "Aesthetic",
    description: "Mood & destination",
    categories: [
      "Old Money", "Parisian", "Scandinavian", "Coastal Chic",
      "Italian Luxury", "Korean Minimalist", "Japanese Contemporary",
      "Modern Indian", "Power Dressing", "Resort Luxury",
    ],
  },
];

const INITIAL_PROVIDERS: Provider[] = [
  {
    id: "prov_aria",
    full_name: "Aria Lavigne",
    email: "aria.provider@example.com",
    mobile: "+919876543210",
    gender: "female",
    birth_date: "1992-04-18T00:00:00.000Z",
    address: "Flat 4B, Pali Hill, Mumbai",
    isActive: true
  },
  {
    id: "prov_milan",
    full_name: "Milan Okafor",
    email: "milan.provider@example.com",
    mobile: "+919876543299",
    gender: "male",
    birth_date: "1988-11-23T00:00:00.000Z",
    address: "12/A Ring Road, New Delhi",
    isActive: true
  },
  {
    id: "prov_sole",
    full_name: "Sole Marchetti",
    email: "sole.provider@example.com",
    mobile: "+919876543311",
    gender: "female",
    birth_date: "1990-09-05T00:00:00.000Z",
    address: "88 Orchid Enclave, Bangalore",
    isActive: true
  }
];

const INITIAL_RATE_CARDS: RateCard[] = [
  {
    id: "rc_01",
    name: "Standard Split AC Service",
    categoryId: "cat_style",
    subcategoryId: "sub_cat_style_quiet-luxury",
    providerId: "prov_aria",
    price: 499.00,
    strikePrice: 699.00,
    weight: 1,
    recommended: true,
    bestDeal: false,
    active: true,
    serviceType: "b2c"
  },
  {
    id: "rc_02",
    name: "Premium Menswear Consultation",
    categoryId: "cat_style",
    subcategoryId: "sub_cat_style_minimalist",
    providerId: "prov_milan",
    price: 1500.00,
    strikePrice: 2000.00,
    weight: 2,
    recommended: true,
    bestDeal: true,
    active: true,
    serviceType: "b2c"
  }
];

const INITIAL_ORDERS: IntakeRequest[] = [
  {
    id: "req_01",
    user_id: "user_aditi",
    user_email: "aditi.r@example.com",
    user_name: "Aditi R.",
    occasion: "Everyday Corporate Capsule",
    budget: "Premium (₹5k–₹15k)",
    gender: "Women",
    style_preference: "Quiet luxury",
    body_type: "Hourglass",
    city: "Mumbai",
    notes: "Need a high-quality corporate professional capsule for my new venture. Clean lines and solid colors only.",
    photo_ids: ["https://images.unsplash.com/photo-1509319117193-57bab727e09d"],
    status: "completed",
    assigned_stylist_id: "prov_aria",
    created_at: "2026-08-01T10:00:00.000Z",
  },
  {
    id: "req_02",
    user_id: "user_raj",
    user_email: "raj.m@example.com",
    user_name: "Raj Malhotra",
    occasion: "Cocktail Party",
    budget: "Luxury (₹15k+)",
    gender: "Men",
    style_preference: "Contemporary Chic",
    body_type: "Rectangle",
    city: "New Delhi",
    notes: "Something modern and standout for a gallery opening dinner. No formal black suits.",
    photo_ids: ["https://images.unsplash.com/photo-1617137968427-85924c800a22"],
    status: "assigned",
    assigned_stylist_id: "prov_milan",
    created_at: "2026-08-10T14:30:00.000Z",
  },
  {
    id: "req_03",
    user_id: "user_kiran",
    user_email: "kiran.d@example.com",
    user_name: "Kiran Devi",
    occasion: "Resort Vacation",
    budget: "Affordable (₹2k–₹5k)",
    gender: "Women",
    style_preference: "Bohemian",
    body_type: "Plus Size",
    city: "Goa",
    notes: "Comfortable resort wear for my upcoming trip to Goa. Breathable fabrics like linens are preferred.",
    photo_ids: [],
    status: "pending",
    assigned_stylist_id: null,
    created_at: "2026-08-15T08:00:00.000Z",
  }
];

const INITIAL_LOOKBOOKS: Lookbook[] = [
  {
    id: "lb_01",
    intake_id: "req_01",
    stylist_user_id: "prov_aria",
    intro_note: "Here is your quiet luxury capsule edit. We focused on highly-structured modular tailoring in shades of sand, espresso, and ivory. Each piece transitions seamlessly from day to evening meetings.",
    items: [
      {
        id: "item_01",
        title: "Sand Structured Blazer",
        description: "Double-breasted silk wool blend blazer. Sharp shoulders and classic lapels for a strong presence.",
        image_url: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=256",
        product_link: "https://quvo.co.in/shop/blazer",
        price: "₹18,500",
        category: "top"
      },
      {
        id: "item_02",
        title: "Ivory Wide-Leg Trousers",
        description: "High-waisted draped wool trousers. Elegant length that moves gracefully.",
        image_url: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=256",
        product_link: "https://quvo.co.in/shop/trousers",
        price: "₹12,000",
        category: "bottom"
      },
      {
        id: "item_03",
        title: "Leather Saddle Loafers",
        description: "Italian calfskin leather loafers in rich espresso brown. Perfect comfort with sharp lines.",
        image_url: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?q=80&w=256",
        product_link: "https://quvo.co.in/shop/shoes",
        price: "₹9,500",
        category: "shoes"
      }
    ],
    created_at: "2026-08-02T11:00:00.000Z",
    updated_at: "2026-08-02T11:00:00.000Z"
  }
];

// Initialize localStorage if keys do not exist
export function initializeDB() {
  if (!localStorage.getItem('quvo_categories')) {
    const categories: Category[] = [];
    INITIAL_CATEGORY_GROUPS.forEach((group, idx) => {
      const parentId = `cat_${toSlug(group.name)}`;
      categories.push({
        id: parentId,
        name: group.name,
        slug: toSlug(group.name),
        description: group.description,
        sortOrder: idx + 1,
        isActive: true,
        parentId: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      group.categories.forEach((sub, subIdx) => {
        categories.push({
          id: `sub_cat_${toSlug(group.name)}_${toSlug(sub)}`,
          name: sub,
          slug: toSlug(sub),
          sortOrder: subIdx + 1,
          isActive: true,
          parentId: parentId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      });
    });
    localStorage.setItem('quvo_categories', JSON.stringify(categories));
  }

  if (!localStorage.getItem('quvo_providers')) {
    localStorage.setItem('quvo_providers', JSON.stringify(INITIAL_PROVIDERS));
  }

  if (!localStorage.getItem('quvo_rate_cards')) {
    localStorage.setItem('quvo_rate_cards', JSON.stringify(INITIAL_RATE_CARDS));
  }

  if (!localStorage.getItem('quvo_orders')) {
    localStorage.setItem('quvo_orders', JSON.stringify(INITIAL_ORDERS));
  }

  if (!localStorage.getItem('quvo_lookbooks')) {
    localStorage.setItem('quvo_lookbooks', JSON.stringify(INITIAL_LOOKBOOKS));
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
