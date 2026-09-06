/* =====================================================================
   StallFree seed data — products, sellers, categories
   Marketplace for crafts and souvenirs: bouquets, printed magnetic
   photos, acrylic keychains, and handmade products.
   Product images are linked from Unsplash (external source).
   ===================================================================== */

const image = (id) =>
  `https://images.unsplash.com/${id}?w=600&q=80&auto=format&fit=crop`;

const categories = [
  { id: 'bouquets', name: 'Bouquets' },
  { id: 'photo-gifts', name: 'Photo Gifts' },
  { id: 'keychains', name: 'Acrylic Keychains' },
  { id: 'handmade', name: 'Handmade Crafts' }
];

const sellers = [
  {
    id: 'bloom-petals',
    storeName: 'Bloom & Petals',
    name: 'Bloom & Petals',
    description: 'Artisan bouquets hand-tied with fresh and dried blooms.',
    img: ['#f472b6', '#fb7185']
  },
  {
    id: 'snapmemory',
    storeName: 'SnapMemory Studio',
    name: 'SnapMemory Studio',
    description: 'Turn your favorite moments into printed magnetic photos.',
    img: ['#94a3b8', '#475569']
  },
  {
    id: 'acrylic-angle',
    storeName: 'Acrylic Angle',
    name: 'Acrylic Angle',
    description: 'Custom acrylic keychains made to order with your design.',
    img: ['#38bdf8', '#7c3aed']
  },
  {
    id: 'handworks-ph',
    storeName: 'Handworks PH',
    name: 'Handworks PH',
    description: 'Soulful handmade crafts from local artisans.',
    img: ['#fbbf24', '#ea580c']
  },
  {
    id: 'baybay-souvenirs',
    storeName: 'Baybay Souvenirs',
    name: 'Baybay Souvenirs',
    description: 'Seaside-inspired souvenirs and keepsakes from the coast.',
    img: ['#0ea5e9', '#14b8a6']
  }
];

const products = [
  {
    id: 'dried-flower-bouquet',
    name: 'Dried Flower Bouquet',
    price: 549,
    sellerId: 'bloom-petals',
    categoryId: 'bouquets',
    rating: 4.8,
    reviews: 210,
    description: 'Hand-tied preserved blooms that stay beautiful for months.',
    image: image('photo-1674541657661-33d94e362d9b'),
    img: ['#f472b6', '#fb7185']
  },
  {
    id: 'fresh-bloom-bouquet',
    name: 'Fresh Bloom Bouquet',
    price: 899,
    sellerId: 'bloom-petals',
    categoryId: 'bouquets',
    rating: 4.7,
    reviews: 160,
    description: 'A fresh-cut bundle wrapped in kraft paper, perfect for gifts.',
    image: image('photo-1771121412135-c4f0c24fe677'),
    img: ['#fda4af', '#f43f5e']
  },
  {
    id: 'mini-bouquet-set',
    name: 'Mini Bouquet Wrapping Set',
    price: 350,
    sellerId: 'bloom-petals',
    categoryId: 'bouquets',
    rating: 4.5,
    reviews: 95,
    description: 'Make your own mini bouquets with assorted stems and wrappers.',
    image: image('photo-1644248423203-80e317d78aee'),
    img: ['#f0abfc', '#c084fc']
  },
  {
    id: 'magnetic-photo-square',
    name: 'Printed Magnetic Photo (Square)',
    price: 199,
    sellerId: 'snapmemory',
    categoryId: 'photo-gifts',
    rating: 4.9,
    reviews: 300,
    description: 'Glossy printed photo on a magnet. Send us any image.',
    image: image('photo-1500051638674-ff996a0ec29e'),
    img: ['#a8a29e', '#57534e']
  },
  {
    id: 'magnetic-photo-set',
    name: 'Magnetic Photo Set of 4',
    price: 650,
    sellerId: 'snapmemory',
    categoryId: 'photo-gifts',
    rating: 4.8,
    reviews: 180,
    description: 'Four printed magnetic photos in coordinating frames.',
    image: image('photo-1771681625705-e6fcc490c8c9'),
    img: ['#94a3b8', '#475569']
  },
  {
    id: 'polaroid-magnetic-photos',
    name: 'Polaroid-Style Magnetic Photos (3pc)',
    price: 399,
    sellerId: 'snapmemory',
    categoryId: 'photo-gifts',
    rating: 4.6,
    reviews: 240,
    description: 'Three vintage polaroid-style prints with a magnetic back.',
    image: image('photo-1755444314262-2e6c7ea83b98'),
    img: ['#cbd5e1', '#64748b']
  },
  {
    id: 'custom-acrylic-keychain',
    name: 'Custom Acrylic Keychain',
    price: 149,
    sellerId: 'acrylic-angle',
    categoryId: 'keychains',
    rating: 4.9,
    reviews: 420,
    description: 'Double-sided laser-cut acrylic keychain with any design.',
    image: image('photo-1674660638936-c0005c862a0d'),
    img: ['#38bdf8', '#6366f1']
  },
  {
    id: 'name-acrylic-keychain',
    name: 'Name Acrylic Keychain',
    price: 129,
    sellerId: 'acrylic-angle',
    categoryId: 'keychains',
    rating: 4.8,
    reviews: 350,
    description: 'Your name in bold letters on clear acrylic with a tassel.',
    image: image('photo-1676276550349-580c49631496'),
    img: ['#c084fc', '#7c3aed']
  },
  {
    id: 'photo-acrylic-keychain',
    name: 'Photo Acrylic Keychain',
    price: 179,
    sellerId: 'acrylic-angle',
    categoryId: 'keychains',
    rating: 4.7,
    reviews: 280,
    description: 'Turn a favorite photo into a keepsake acrylic keychain.',
    image: image('photo-1727154085760-134cc942246e'),
    img: ['#22d3ee', '#a78bfa']
  },
  {
    id: 'crochet-plush',
    name: 'Crochet Mini Plush',
    price: 450,
    sellerId: 'handworks-ph',
    categoryId: 'handmade',
    rating: 4.9,
    reviews: 120,
    description: 'A one-of-a-kind crocheted plush made from soft yarn.',
    image: image('photo-1671212684942-5c8a3dc3234e'),
    img: ['#fbbf24', '#fb923c']
  },
  {
    id: 'handwoven-tote',
    name: 'Handwoven Tote Bag',
    price: 780,
    sellerId: 'handworks-ph',
    categoryId: 'handmade',
    rating: 4.7,
    reviews: 88,
    description: 'Sturdy woven tote in natural fibers with a zippered pocket.',
    image: image('photo-1524679813234-66a389fe1a42'),
    img: ['#a16207', '#92400e']
  },
  {
    id: 'beaded-bracelet',
    name: 'Beaded Friendship Bracelet',
    price: 220,
    sellerId: 'handworks-ph',
    categoryId: 'handmade',
    rating: 4.6,
    reviews: 310,
    description: 'Hand-strung beads with an adjustable cord, made to order.',
    image: image('photo-1766560360087-b97dc4cc40c7'),
    img: ['#fb7185', '#f472b6']
  },
  {
    id: 'wooden-figurine',
    name: 'Hand-Carved Wooden Figurine',
    price: 550,
    sellerId: 'handworks-ph',
    categoryId: 'handmade',
    rating: 4.8,
    reviews: 64,
    description: 'Locally carved wooden figure, sealed with natural oil.',
    image: image('photo-1598379873226-a9bd21912e5d'),
    img: ['#b45309', '#78350f']
  },
  {
    id: 'shell-wind-chime',
    name: 'Shell Wind Chime',
    price: 480,
    sellerId: 'baybay-souvenirs',
    categoryId: 'handmade',
    rating: 4.7,
    reviews: 140,
    description: 'String of sun-bleached seashells on a driftwood hanger.',
    image: image('photo-1754873800920-d1f505753f55'),
    img: ['#67e8f9', '#0ea5e9']
  },
  {
    id: 'raffia-hat',
    name: 'Raffia Souvenir Hat',
    price: 690,
    sellerId: 'baybay-souvenirs',
    categoryId: 'handmade',
    rating: 4.5,
    reviews: 76,
    description: 'Handwoven raffia hat with a woven band and chin strap.',
    image: image('photo-1745284504942-2eb53650360a'),
    img: ['#eab308', '#d97706']
  },
  {
    id: 'painted-mini-vase',
    name: 'Painted Mini Souvenir Vase',
    price: 320,
    sellerId: 'baybay-souvenirs',
    categoryId: 'handmade',
    rating: 4.6,
    reviews: 105,
    description: 'Small ceramic vase in hand-painted coastal patterns.',
    image: image('photo-1753957012011-080e80aaec21'),
    img: ['#a3e635', '#4d7c0f']
  }
];

/* -------- Lookup helpers -------- */
function findCategory(id) {
  return categories.find((c) => c.id === id);
}

function findSeller(id) {
  return sellers.find((s) => s.id === id);
}

function findProduct(id) {
  return products.find((p) => p.id === id);
}

function productsBySeller(sellerId) {
  return products.filter((p) => p.sellerId === sellerId);
}

function productsByCategory(categoryId) {
  return products.filter((p) => p.categoryId === categoryId);
}

function sellerRating(sellerId) {
  const list = productsBySeller(sellerId);
  if (!list.length) return 0;
  return list.reduce((sum, p) => sum + p.rating, 0) / list.length;
}

function sellerProductCount(sellerId) {
  return productsBySeller(sellerId).length;
}

function categoryCount(categoryId) {
  return productsByCategory(categoryId).length;
}