import { Product } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'veyro-001',
    name: 'IDENTITY Heavyweight Boxy Tee',
    slug: 'identity-heavyweight-boxy-tee',
    price: 4999,
    originalPrice: 5999,
    category: 'Oversized T-Shirts',
    description: 'Crafted from ultra-dense 320 GSM combed cotton, the IDENTITY Boxy Tee features dropped shoulders, a reinforced thick rib collar, and a signature rubberized VEYRO chest emblem. Built for structured drape and long-lasting raw texture.',
    fabricDetails: '100% Combed Heavyweight Organic Cotton • 320 GSM • Pre-shrunk Anti-fade Wash',
    gsm: 320,
    fit: 'Oversized Boxy Fit',
    images: [
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1000&auto=format&fit=crop'
    ],
    colors: [
      { name: 'Obsidian Black', hex: '#121212' },
      { name: 'Alabaster White', hex: '#F5F5F3' },
      { name: 'Concrete Grey', hex: '#636363' }
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    inStock: true,
    isNewArrival: true,
    isTrending: true,
    rating: 4.9,
    reviewCount: 128,
    tags: ['Heavyweight', 'Boxy Fit', 'Best Seller', '320 GSM'],
    createdAt: '2026-07-15'
  },
  {
    id: 'veyro-002',
    name: 'ASTRAL DYNASTY Vintage Graphic Tee',
    slug: 'astral-dynasty-vintage-graphic-tee',
    price: 5499,
    originalPrice: 6499,
    category: 'Graphic T-Shirts',
    description: 'Featuring a multi-layer screen printed celestial graphic with distressed vintage acid treatment. Each piece undergoes a custom stone wash process making every garment uniquely patterned.',
    fabricDetails: '100% Ring-Spun Cotton • 280 GSM • Hand Acid Wash Finish',
    gsm: 280,
    fit: 'Oversized Boxy Fit',
    images: [
      'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=1000&auto=format&fit=crop'
    ],
    colors: [
      { name: 'Washed Charcoal', hex: '#2A2A2A' },
      { name: 'Vintage Sand', hex: '#D2C2B0' }
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    inStock: true,
    isNewArrival: true,
    isTrending: true,
    rating: 4.8,
    reviewCount: 94,
    tags: ['Graphic', 'Acid Wash', 'Vintage', 'Limited Screenprint'],
    createdAt: '2026-07-20'
  },
  {
    id: 'veyro-003',
    name: 'MONOLITH 480GSM French Terry Hoodie',
    slug: 'monolith-480gsm-french-terry-hoodie',
    price: 11999,
    originalPrice: 13999,
    category: 'Hoodies',
    description: 'The pinnacle of luxury outerwear. Engineered with ultra-dense 480 GSM French Terry loopback cotton, a double-lined crossover hood without drawstrings, and high-density tonal VEYRO rear embroidery.',
    fabricDetails: '100% Heavy French Terry Loopback Cotton • 480 GSM • Ribbed Cuffs & Side Gussets',
    gsm: 480,
    fit: 'Oversized Boxy Fit',
    images: [
      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=1000&auto=format&fit=crop'
    ],
    colors: [
      { name: 'Pitch Black', hex: '#0B0B0B' },
      { name: 'Muted Taupe', hex: '#7A7267' },
      { name: 'Off-White', hex: '#EAEAE6' }
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    inStock: true,
    isTrending: true,
    rating: 5.0,
    reviewCount: 210,
    tags: ['480 GSM', 'French Terry', 'Double-Lined', 'Flagship'],
    createdAt: '2026-06-10'
  },
  {
    id: 'veyro-004',
    name: 'DROP 004: CHRONO Tactical Puffer Jacket',
    slug: 'drop-004-chrono-tactical-puffer-jacket',
    price: 15999,
    originalPrice: 18999,
    category: 'Limited Edition Drops',
    description: 'Limited to 250 serialized pieces worldwide. Features matte water-resistant nylon shell, thermal synthetic fill insulation, magnetic storm flap closures, and modular utility straps with detachable metal hardware.',
    fabricDetails: '100% Matte Ripstop Nylon Shell • 700-Fill Power Warmth • Waterproof Membrane',
    gsm: 400,
    fit: 'Cropped Streetwear Fit',
    images: [
      'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1548883354-7622d03aca27?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1516257984-b1b4d707412e?q=80&w=1000&auto=format&fit=crop'
    ],
    colors: [
      { name: 'Stealth Black', hex: '#181818' },
      { name: 'Glacier Silver', hex: '#B8C0C2' }
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    inStock: true,
    isLimitedDrop: true,
    isNewArrival: true,
    dropNumber: 'DROP 004',
    rating: 4.9,
    reviewCount: 64,
    tags: ['Limited Drop', 'Tactical', 'Outerwear', 'Waterproof'],
    createdAt: '2026-08-01'
  },
  {
    id: 'veyro-005',
    name: 'CYBER PUNISHMENT Oversized Graphic Tee',
    slug: 'cyber-punishment-oversized-graphic-tee',
    price: 4999,
    originalPrice: 5999,
    category: 'Graphic T-Shirts',
    description: 'A bold, futuristic dystopian typography piece printed on ultra-soft heavy combed jersey. High-density puff print detailing gives tactile dimensionality to the graphics.',
    fabricDetails: '100% Organic Combed Cotton • 300 GSM • 3D High-Density Puff Print',
    gsm: 300,
    fit: 'Oversized Boxy Fit',
    images: [
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=1000&auto=format&fit=crop'
    ],
    colors: [
      { name: 'Midnight Navy', hex: '#1A222E' },
      { name: 'Obsidian Black', hex: '#121212' }
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    inStock: true,
    rating: 4.7,
    reviewCount: 45,
    tags: ['Puff Print', 'Graphic', 'Cyberpunk', '300 GSM'],
    createdAt: '2026-07-02'
  },
  {
    id: 'veyro-006',
    name: 'ARCHETYPE Raw Edge Drop-Shoulder Tee',
    slug: 'archetype-raw-edge-drop-shoulder-tee',
    price: 3999,
    originalPrice: 4999,
    category: 'Oversized T-Shirts',
    description: 'Unprocessed raw sleeve hem finish with subtle distressing around the collar line. Clean, unbranded front with laser-etched metal brand badge at the lower hem.',
    fabricDetails: '100% Premium Cotton Jersey • 290 GSM • Unfinished Raw Hems',
    gsm: 290,
    fit: 'Relaxed Fit',
    images: [
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop'
    ],
    colors: [
      { name: 'Olive Drab', hex: '#3E4437' },
      { name: 'Bone White', hex: '#EBE8DF' },
      { name: 'Shadow Black', hex: '#1A1A1A' }
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    inStock: true,
    rating: 4.8,
    reviewCount: 88,
    tags: ['Raw Hem', 'Minimalist', 'Metal Badge'],
    createdAt: '2026-06-25'
  },
  {
    id: 'veyro-007',
    name: 'SHADOW REALM Cropped Zip Hoodie',
    slug: 'shadow-realm-cropped-zip-hoodie',
    price: 10999,
    originalPrice: 12999,
    category: 'Hoodies',
    description: 'Designed with a tailored cropped waist ratio to highlight layering underneath. Equipped with two-way heavy YKK matte metal zippers and oversized raglan sleeve cuts.',
    fabricDetails: '100% Heavy French Terry Cotton • 450 GSM • Two-Way YKK Zipper',
    gsm: 450,
    fit: 'Cropped Streetwear Fit',
    images: [
      'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1000&auto=format&fit=crop'
    ],
    colors: [
      { name: 'Washed Black', hex: '#222222' },
      { name: 'Cement Grey', hex: '#888888' }
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    inStock: true,
    isTrending: true,
    rating: 4.9,
    reviewCount: 112,
    tags: ['Zip Hoodie', 'Two-Way Zip', 'Cropped', 'Layering'],
    createdAt: '2026-07-10'
  },
  {
    id: 'veyro-008',
    name: 'LIMITED: Tactical Modular Cargo Trousers',
    slug: 'limited-tactical-modular-cargo-trousers',
    price: 12999,
    originalPrice: 14999,
    category: 'Limited Edition Drops',
    description: 'High-density heavyweight cotton twill trousers with 3D accordion cargo pockets, adjustable ankle cinch cords, and matte magnetic buckle webbing belt included.',
    fabricDetails: '98% Cotton Twill, 2% Elastane Flex • 380 GSM • Water-Repellent Coating',
    gsm: 380,
    fit: 'Relaxed Fit',
    images: [
      'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?q=80&w=1000&auto=format&fit=crop'
    ],
    colors: [
      { name: 'Tactical Black', hex: '#161616' },
      { name: 'Desert Khaki', hex: '#8C826B' }
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    inStock: true,
    isLimitedDrop: true,
    dropNumber: 'DROP 003',
    rating: 4.8,
    reviewCount: 76,
    tags: ['Cargo', 'Tactical', 'Modular', 'Adjustable Cinch'],
    createdAt: '2026-07-28'
  },
  {
    id: 'veyro-009',
    name: 'REBEL VISION Vintage Acid Wash Hoodie',
    slug: 'rebel-vision-vintage-acid-wash-hoodie',
    price: 9999,
    originalPrice: 11999,
    category: 'Hoodies',
    description: 'Custom sun-faded wash with hand-distressed edge grinding along cuffs and hem. Soft brushed fleece interior for maximum thermal warmth.',
    fabricDetails: '80% Heavy Cotton, 20% Polyester Fleece • 420 GSM • Hand Distressed',
    gsm: 420,
    fit: 'Oversized Boxy Fit',
    images: [
      'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1000&auto=format&fit=crop'
    ],
    colors: [
      { name: 'Acid Washed Black', hex: '#2D2D2D' },
      { name: 'Sun-Bleached Sand', hex: '#C9BFA8' }
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    inStock: true,
    rating: 4.7,
    reviewCount: 58,
    tags: ['Distressed', 'Acid Wash', 'Heavyweight'],
    createdAt: '2026-06-18'
  },
  {
    id: 'veyro-010',
    name: 'MONOGRAM CIPHER Heavyweight Graphic Tee',
    slug: 'monogram-cipher-heavyweight-graphic-tee',
    price: 4499,
    originalPrice: 5499,
    category: 'Graphic T-Shirts',
    description: 'Subtle high-gloss tonal monogram print across back with minimalist architectural VEYRO coordinate embroidery on front pocket area.',
    fabricDetails: '100% Organic Heavyweight Cotton • 310 GSM • High-Gloss Rubber Screenprint',
    gsm: 310,
    fit: 'Oversized Boxy Fit',
    images: [
      'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?q=80&w=1000&auto=format&fit=crop'
    ],
    colors: [
      { name: 'Pure White', hex: '#FFFFFF' },
      { name: 'Obsidian Black', hex: '#121212' }
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    inStock: true,
    rating: 4.6,
    reviewCount: 39,
    tags: ['Graphic', 'Monogram', 'Minimalist'],
    createdAt: '2026-07-05'
  }
];

export const INITIAL_REVIEWS = [
  {
    id: 'rev-1',
    productId: 'veyro-001',
    userName: 'Kaelen R.',
    rating: 5,
    title: 'Unbelievable drape and weight!',
    comment: 'The 320 GSM fabric is no joke. Holds its boxy shape even after 5 washes. Best oversized tee in my rotation hands down.',
    createdAt: '2026-07-28',
    verifiedPurchase: true,
    fitFeedback: 'True to Size' as const
  },
  {
    id: 'rev-2',
    productId: 'veyro-001',
    userName: 'Marcus T.',
    rating: 5,
    title: 'High end streetwear quality',
    comment: 'Feeds right into that luxury minimalist aesthetic. Collar is thick and doesn’t bacon. Ordered M and I’m 6’1, fits perfect.',
    createdAt: '2026-08-01',
    verifiedPurchase: true,
    fitFeedback: 'True to Size' as const
  },
  {
    id: 'rev-3',
    productId: 'veyro-003',
    userName: 'Soren V.',
    rating: 5,
    title: 'Heavy as armor. Perfect hoodie.',
    comment: 'The 480 GSM French Terry is ridiculously cozy. No floppy drawstrings, double lined hood sits super high. Worth every single penny.',
    createdAt: '2026-07-14',
    verifiedPurchase: true,
    fitFeedback: 'True to Size' as const
  },
  {
    id: 'rev-4',
    productId: 'veyro-004',
    userName: 'Elena M.',
    rating: 5,
    title: 'Tactical grail jacket',
    comment: 'The magnetic closures and hardware feel so premium. Gets compliments every time I wear it out in the city.',
    createdAt: '2026-08-05',
    verifiedPurchase: true,
    fitFeedback: 'True to Size' as const
  }
];
