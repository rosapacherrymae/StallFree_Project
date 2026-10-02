/* =====================================================================
   StallFree seed data — catalog, shops, categories, reviews, coupons
   A marketplace for handmade gifts, souvenirs, and local craft stalls.
   Photos are served from Unsplash; every URL below is verified live.
   ===================================================================== */

const PHOTO_BASE = 'https://images.unsplash.com/';

function photoUrl(id, w = 600) {
  return PHOTO_BASE + id + '?w=' + w + '&q=80&auto=format&fit=crop';
}

/* Four 4:5 crops of the same shot stand in for a full listing gallery.
   Etsy crops listing heroes to 4:5 — we do the same so thumbnails and the
   detail view read identically. */
const GALLERY_CROPS = ['entropy', 'top', 'bottom', 'left'];

function galleryPhotos(id, count = 4) {
  return GALLERY_CROPS.slice(0, Math.max(1, count)).map(
    (crop) => `${PHOTO_BASE}${id}?w=800&h=1000&q=80&auto=format&fit=crop&crop=${crop}`
  );
}

/* ================= Categories ================= */

const categories = [
  {
    id: 'bouquets',
    name: 'Bouquets & Blooms',
    blurb: 'Hand-tied fresh and everlasting arrangements.',
    tile: 'photo-1490750967868-88aa4486c946',
    colors: ['#fb7185', '#f43f5e']
  },
  {
    id: 'photo-gifts',
    name: 'Photo Gifts',
    blurb: 'Your favourite moments, printed and framed.',
    tile: 'photo-1513519245088-0e12902e5a38',
    colors: ['#94a3b8', '#475569']
  },
  {
    id: 'keychains',
    name: 'Keychains & Charms',
    blurb: 'Personalised tags, plates, and keepsake charms.',
    tile: 'photo-1727154085760-134cc942246e',
    colors: ['#38bdf8', '#6366f1']
  },
  {
    id: 'handmade',
    name: 'Handmade Crafts',
    blurb: 'Stitched, carved, and woven by local makers.',
    tile: 'photo-1524679813234-66a389fe1a42',
    colors: ['#fbbf24', '#ea580c']
  },
  {
    id: 'coastal',
    name: 'Coastal Souvenirs',
    blurb: 'Seaside keepsakes gathered from the shore.',
    tile: 'photo-1745284504942-2eb53650360a',
    colors: ['#0ea5e9', '#14b8a6']
  },
  {
    id: 'home',
    name: 'Home & Decor',
    blurb: 'Ceramics, candles, and quiet corners.',
    tile: 'photo-1603006905003-be475563bc59',
    colors: ['#a78bfa', '#7c3aed']
  },
  {
    id: 'paper',
    name: 'Paper Goods',
    blurb: 'Planners, journals, wraps, and letterpress cards.',
    tile: 'photo-1506784983877-45594efa4cbe',
    colors: ['#34d399', '#059669']
  },
  {
    id: 'accessories',
    name: 'Bags & Jewelry',
    blurb: 'Everyday carry and dainty, wearable details.',
    tile: 'photo-1584917865442-de89df76afd3',
    colors: ['#f472b6', '#db2777']
  }
];

/* ================= Shops ================= */

const sellers = [
  {
    id: 'bloom-petals',
    storeName: 'Bloom & Petals',
    tagline: 'Artisan bouquets, hand-tied every morning',
    description:
      'We build every arrangement to order with market-fresh stems, dried grasses, and recycled kraft wrap. Same-day delivery inside Metro Manila.',
    location: 'Quezon City, PH',
    since: 2021,
    followers: 1840,
    colors: ['#f472b6', '#fb7185'],
    cover: 'photo-1487070183336-b863922373d4',
    policies: {
      processing: 'Ships in 1-2 business days',
      shipping: 'Nationwide delivery, free over ₱1,000',
      returns: 'Replacement for damaged blooms within 3 days'
    }
  },
  {
    id: 'snapmemory',
    storeName: 'SnapMemory Studio',
    tagline: 'Printed memories you can stick anywhere',
    description:
      'Magnetic prints, polaroid-style sets, and framed photo gifts made from your uploads. Colour-checked by hand before every pack-out.',
    location: 'Marikina, PH',
    since: 2020,
    followers: 3120,
    colors: ['#94a3b8', '#475569'],
    cover: 'photo-1500051638674-ff996a0ec29e',
    policies: {
      processing: 'Ships in 2-3 business days',
      shipping: 'Nationwide delivery, free over ₱1,000',
      returns: 'Free reprint if the print arrives flawed'
    }
  },
  {
    id: 'acrylic-angle',
    storeName: 'Acrylic Angle',
    tagline: 'Custom keychains cut to your design',
    description:
      'Laser-cut tags, engraved plates, and keepsake charms. Send us a name, a date, or a doodle and we will cut it the same day.',
    location: 'Cebu City, PH',
    since: 2022,
    followers: 2470,
    colors: ['#38bdf8', '#7c3aed'],
    cover: 'photo-1674660638936-c0005c862a0d',
    policies: {
      processing: 'Ships in 1-3 business days',
      shipping: 'Nationwide delivery, free over ₱1,000',
      returns: 'Remake for free if the engraving is wrong'
    }
  },
  {
    id: 'handworks-ph',
    storeName: 'Handworks PH',
    tagline: 'Soulful crafts from makers we know by name',
    description:
      'Crochet, weaving, beadwork, and woodwork sourced from artisan partners across Luzon and the Visayas. Fair prices, honest materials.',
    location: 'Baguio, PH',
    since: 2019,
    followers: 4210,
    colors: ['#fbbf24', '#ea580c'],
    cover: 'photo-1556742049-0cfed4f6a45d',
    policies: {
      processing: 'Ships in 2-4 business days',
      shipping: 'Nationwide delivery, free over ₱1,000',
      returns: 'Returns accepted within 7 days'
    }
  },
  {
    id: 'baybay-souvenirs',
    storeName: 'Baybay Souvenirs',
    tagline: 'Keepsakes gathered from the coast',
    description:
      'Sun-bleached shells, woven raffia, and hand-painted ceramics inspired by long afternoons by the sea. Every piece is finished in our Bohol workshop.',
    location: 'Tagbilaran, PH',
    since: 2021,
    followers: 960,
    colors: ['#0ea5e9', '#14b8a6'],
    cover: 'photo-1754873800920-d1f505753f55',
    policies: {
      processing: 'Ships in 2-4 business days',
      shipping: 'Nationwide delivery, free over ₱1,000',
      returns: 'Returns accepted within 7 days'
    }
  },
  {
    id: 'clay-kiln',
    storeName: 'Clay & Kiln',
    tagline: 'Small-batch ceramics and slow-burn candles',
    description:
      'Wheel-thrown stoneware and hand-poured soy candles, fired and finished in a two-person studio. No two glazes land exactly alike.',
    location: 'Pampanga, PH',
    since: 2023,
    followers: 720,
    colors: ['#a78bfa', '#7c3aed'],
    cover: 'photo-1610701596007-11502861dcfa',
    policies: {
      processing: 'Ships in 3-5 business days',
      shipping: 'Nationwide delivery, free over ₱1,000',
      returns: 'Replacement if items arrive chipped'
    }
  },
  {
    id: 'paper-trail',
    storeName: 'Paper Trail PH',
    tagline: 'Planners, journals, and gift wrap',
    description:
      'Bound by hand in small runs. Dot grids that take fountain ink, planners that actually fit a school term, and wrap that survives ribbon.',
    location: 'Manila, PH',
    since: 2022,
    followers: 1560,
    colors: ['#34d399', '#059669'],
    cover: 'photo-1546074177-ffdda98d214f',
    policies: {
      processing: 'Ships in 1-2 business days',
      shipping: 'Nationwide delivery, free over ₱1,000',
      returns: 'Returns accepted within 7 days'
    }
  },
  {
    id: 'manila-carry',
    storeName: 'Manila Carry Co.',
    tagline: 'Bags built for the daily commute',
    description:
      'Structured handbags, roomy totes, and weather-ready backpacks with padded sleeves. Designed in Manila, stitched by a family workshop in Marikina.',
    location: 'Manila, PH',
    since: 2020,
    followers: 2890,
    colors: ['#f87171', '#dc2626'],
    cover: 'photo-1441986300917-64674bd600d8',
    policies: {
      processing: 'Ships in 1-3 business days',
      shipping: 'Nationwide delivery, free over ₱1,000',
      returns: 'Returns accepted within 7 days'
    }
  },
  {
    id: 'gilded-ph',
    storeName: 'Gilded PH',
    tagline: 'Dainty gold-plated jewellery',
    description:
      'Everyday pieces in 18k gold plating over stainless steel — water-friendly, tarnish-resistant, and packed in a reusable pouch.',
    location: 'Pasig, PH',
    since: 2023,
    followers: 1310,
    colors: ['#fcd34d', '#d97706'],
    cover: 'photo-1617038220319-276d3cfab638',
    policies: {
      processing: 'Ships in 1-2 business days',
      shipping: 'Nationwide delivery, free over ₱1,000',
      returns: 'Exchange within 7 days'
    }
  }
];

/* ================= Products ================= */

const products = [
  {
    id: 'grand-yellow-rose-bouquet',
    name: 'Grand Yellow Rose Bouquet',
    price: 1450,
    sellerId: 'bloom-petals',
    categoryId: 'bouquets',
    rating: 4.9,
    reviews: 88,
    description:
      'Twenty-five long-stem yellow roses packed into a hand-tied dome and finished with a satin ribbon. Our biggest bouquet for graduations and farewells.',
    photo: 'photo-1772688168328-ebe5d4ac21dc',
    badge: 'bestseller',
    materials: 'Long-stem yellow roses, satin ribbon, water pack',
    processing: 'Same-day for orders before 12nn',
    freeShipping: true,
    stock: 12,
    sales: 210,
    tags: ['large bouquet', 'yellow roses', 'graduation', 'gift']
  },
  {
    id: 'statement-rose-arrangement',
    name: 'Statement Rose Arrangement in Ceramic',
    price: 1650,
    sellerId: 'bloom-petals',
    categoryId: 'bouquets',
    rating: 4.7,
    reviews: 41,
    description:
      'Deep red roses set into a matte ceramic vase you can keep long after the blooms are gone. A centrepiece sized for a dining table.',
    photo: 'photo-1615924162489-97ab2f8a9fa1',
    badge: null,
    materials: 'Red roses, matte ceramic vase, floral foam',
    processing: '2-3 business days',
    freeShipping: true,
    stock: 9,
    sales: 96,
    tags: ['red roses', 'vase arrangement', 'centerpiece', 'anniversary']
  },
  {
    id: 'garden-spill-arrangement',
    name: 'Garden Spill Table Arrangement',
    price: 1750,
    sellerId: 'bloom-petals',
    categoryId: 'bouquets',
    rating: 4.8,
    reviews: 23,
    description:
      'A loose, garden-style arrangement of mixed seasonal stems that spills over the rim of a low bowl. Designed to be seen from every seat.',
    photo: 'photo-1682449683512-8b889dac7c50',
    badge: 'new',
    materials: 'Seasonal mixed stems, low ceramic bowl, moss',
    processing: '3-4 business days',
    freeShipping: true,
    stock: 7,
    sales: 34,
    tags: ['garden style', 'table arrangement', 'seasonal', 'statement']
  },
  {
    id: 'grand-mixed-bloom-vase',
    name: 'Grand Mixed Bloom Vase',
    price: 1350,
    compareAt: 1490,
    sellerId: 'bloom-petals',
    categoryId: 'bouquets',
    rating: 4.6,
    reviews: 64,
    description:
      'Lilies, roses, and spray chrysanthemums arranged in a tall glass vase, boxed for safe delivery. A generous all-occasion gift.',
    photo: 'photo-1558879860-45f24b366ea1',
    badge: 'sale',
    materials: 'Lilies, roses, chrysanthemums, glass vase',
    processing: '1-2 business days',
    freeShipping: true,
    stock: 15,
    sales: 188,
    tags: ['mixed flowers', 'vase', 'all occasion', 'gift']
  },
  {
    id: 'roses-in-a-box-gift',
    name: 'Dozen Roses in a Gift Box',
    price: 1890,
    sellerId: 'bloom-petals',
    categoryId: 'bouquets',
    rating: 4.9,
    reviews: 72,
    description:
      'A dozen premium roses delivered inside a rigid gift box with the stems in a water pack, so they open fresh on arrival.',
    photo: 'photo-1547848803-2937f52e76f5',
    badge: 'bestseller',
    materials: 'Twelve premium roses, rigid box, water pack',
    processing: 'Same-day for orders before 12nn',
    freeShipping: true,
    stock: 10,
    sales: 254,
    tags: ['boxed roses', 'luxury', 'romantic', 'gift box']
  },
  {
    id: 'petite-dried-posy',
    name: 'Petite Dried Flower Posy',
    price: 329,
    sellerId: 'bloom-petals',
    categoryId: 'bouquets',
    rating: 4.7,
    reviews: 55,
    description:
      'A palm-sized posy of dried bunny tails and statice, tied with linen thread. Lasts a year without water.',
    photo: 'photo-1758125158127-fe51202f5b4f',
    badge: null,
    materials: 'Dried bunny tail, statice, linen thread',
    processing: '1-2 business days',
    freeShipping: false,
    stock: 40,
    sales: 312,
    tags: ['mini bouquet', 'dried flowers', 'desk', 'budget']
  },
  {
    id: 'desk-posy-in-glass',
    name: 'Desk Posy in Glass Vase',
    price: 399,
    sellerId: 'bloom-petals',
    categoryId: 'bouquets',
    rating: 4.8,
    reviews: 37,
    description:
      'Three soft pink roses in a small glass vase, sized for a desk, a nightstand, or a hospital table.',
    photo: 'photo-1613279060119-2053dc14f8d2',
    badge: 'new',
    materials: 'Pink roses, small glass vase, floral foam',
    processing: 'Same-day for orders before 12nn',
    freeShipping: false,
    stock: 28,
    sales: 141,
    tags: ['mini bouquet', 'pink roses', 'desk', 'get well']
  },
  {
    id: 'petite-pink-rose-jar',
    name: 'Petite Pink Rose Jar',
    price: 349,
    sellerId: 'bloom-petals',
    categoryId: 'bouquets',
    rating: 4.6,
    reviews: 44,
    description:
      'A cluster of blush roses in a preserve jar with a water pack at the base. A small gift that still feels considered.',
    photo: 'photo-1605116870516-adb617e9b287',
    badge: null,
    materials: 'Blush roses, glass preserve jar, water pack',
    processing: '1-2 business days',
    freeShipping: false,
    stock: 33,
    sales: 178,
    tags: ['mini bouquet', 'blush roses', 'jar', 'table favour']
  },
  {
    id: 'single-stem-rose-vase',
    name: 'Single Stem Rose Vase',
    price: 279,
    sellerId: 'bloom-petals',
    categoryId: 'bouquets',
    rating: 4.8,
    reviews: 96,
    description:
      'One perfect rose in a slim bud vase. The classic pick-me-up for a desk or a bedside table.',
    photo: 'photo-1598977900878-e6cb69ee4b93',
    badge: 'bestseller',
    materials: 'Single rose, slim bud vase, water pack',
    processing: 'Same-day for orders before 12nn',
    freeShipping: false,
    stock: 60,
    sales: 520,
    tags: ['mini bouquet', 'single stem', 'desk', 'small gift']
  },
  {
    id: 'little-white-purple-bunch',
    name: 'Little White and Purple Bunch',
    price: 369,
    compareAt: 429,
    sellerId: 'bloom-petals',
    categoryId: 'bouquets',
    rating: 4.7,
    reviews: 31,
    description:
      'White and lilac blooms tied into a small hand-held bunch, wrapped in tissue and finished with washi tape.',
    photo: 'photo-1610089252470-e72e5063c5e0',
    badge: 'sale',
    materials: 'White and lilac seasonal blooms, tissue, washi tape',
    processing: '1-2 business days',
    freeShipping: false,
    stock: 25,
    sales: 132,
    tags: ['mini bouquet', 'purple', 'hand tied', 'budget']
  },
  {
    id: 'pink-wrapped-18th-birthday-bouquet',
    name: 'Pink Wrapped 18th Birthday Bouquet',
    price: 1090,
    sellerId: 'bloom-petals',
    categoryId: 'bouquets',
    rating: 4.9,
    reviews: 67,
    description:
      'Blush roses and carnations wrapped in layered pink paper with a numbered eighteen tag. Built for debut photos.',
    photo: 'photo-1680563094046-5d846e2c59d1',
    badge: 'bestseller',
    materials: 'Roses, carnations, layered pink wrap, number tag',
    processing: 'Same-day for orders before 12nn',
    freeShipping: true,
    stock: 14,
    sales: 287,
    tags: ['18th birthday', 'debut', 'pink', 'birthday bouquet']
  },
  {
    id: 'brights-18th-birthday-bouquet',
    name: 'Brights 18th Birthday Bouquet',
    price: 1150,
    sellerId: 'bloom-petals',
    categoryId: 'bouquets',
    rating: 4.7,
    reviews: 38,
    description:
      'Yellow, blue, and purple blooms in a cheerful mix, tied with a curling ribbon. Loud in the best way.',
    photo: 'photo-1599577011266-9c006a93c294',
    badge: null,
    materials: 'Mixed seasonal blooms, curling ribbon, kraft wrap',
    processing: '1-2 business days',
    freeShipping: true,
    stock: 16,
    sales: 143,
    tags: ['18th birthday', 'colorful', 'birthday bouquet', 'debut']
  },
  {
    id: 'purple-pop-18th-birthday-bouquet',
    name: 'Purple Pop 18th Birthday Bouquet',
    price: 1050,
    sellerId: 'bloom-petals',
    categoryId: 'bouquets',
    rating: 4.8,
    reviews: 29,
    description:
      'Lavender and magenta flowers with a purple foil wrap. A bold choice for a bold birthday.',
    photo: 'photo-1606101083393-bded314215cd',
    badge: 'new',
    materials: 'Lavender and magenta blooms, foil wrap, ribbon',
    processing: '1-2 business days',
    freeShipping: true,
    stock: 18,
    sales: 61,
    tags: ['18th birthday', 'purple', 'birthday bouquet', 'foil wrap']
  },
  {
    id: 'pink-yellow-18th-birthday-bouquet',
    name: 'Pink and Yellow 18th Birthday Bouquet',
    price: 990,
    sellerId: 'bloom-petals',
    categoryId: 'bouquets',
    rating: 4.6,
    reviews: 46,
    description:
      'Pink and yellow roses with eucalyptus, wrapped in butter paper. Bright without being overwhelming.',
    photo: 'photo-1591350706059-15adf7a1df05',
    badge: null,
    materials: 'Pink and yellow roses, eucalyptus, butter paper',
    processing: 'Same-day for orders before 12nn',
    freeShipping: true,
    stock: 20,
    sales: 176,
    tags: ['18th birthday', 'pink', 'yellow', 'birthday bouquet']
  },
  {
    id: 'red-white-18th-birthday-bouquet',
    name: 'Red and White Debut Bouquet',
    price: 1250,
    compareAt: 1390,
    sellerId: 'bloom-petals',
    categoryId: 'bouquets',
    rating: 4.8,
    reviews: 34,
    description:
      'Red and white roses with wax flower, boxed and ribboned for a formal debut entrance.',
    photo: 'photo-1617340290153-3a2ab0bbc925',
    badge: 'sale',
    materials: 'Red and white roses, wax flower, rigid box',
    processing: '1-2 business days',
    freeShipping: true,
    stock: 11,
    sales: 88,
    tags: ['18th birthday', 'debut', 'red roses', 'boxed']
  },
  {
    id: 'celebration-18th-birthday-bouquet',
    name: 'Celebration 18th Birthday Bouquet',
    price: 1350,
    sellerId: 'bloom-petals',
    categoryId: 'bouquets',
    rating: 4.9,
    reviews: 52,
    description:
      'A full celebration bouquet of roses, lilies, and chrysanthemums with a balloon add-on option. Big entrance energy.',
    photo: 'photo-1667489024245-7beb09ac43c5',
    badge: 'bestseller',
    materials: 'Roses, lilies, chrysanthemums, ribbon',
    processing: 'Same-day for orders before 12nn',
    freeShipping: true,
    stock: 13,
    sales: 231,
    tags: ['18th birthday', 'celebration', 'large bouquet', 'debut']
  },
  {
    id: 'everlast-anniversary-roses',
    name: 'Everlast Anniversary Rose Vase',
    price: 1490,
    sellerId: 'bloom-petals',
    categoryId: 'bouquets',
    rating: 4.8,
    reviews: 43,
    description:
      'Pink and yellow roses arranged in a white ceramic vase, delivered with a handwritten anniversary card.',
    photo: 'photo-1610599929507-fac366fb4252',
    badge: null,
    materials: 'Pink and yellow roses, white ceramic vase',
    processing: '2-3 business days',
    freeShipping: true,
    stock: 10,
    sales: 119,
    tags: ['anniversary', 'roses', 'vase', 'romantic']
  },
  {
    id: 'blush-roses-anniversary-vase',
    name: 'Blush Roses Anniversary Vase',
    price: 1290,
    sellerId: 'bloom-petals',
    categoryId: 'bouquets',
    rating: 4.7,
    reviews: 36,
    description:
      'Blush and white roses at full bloom, cut short in a low glass cube. Made for a candlelit table.',
    photo: 'photo-1610599929527-2fc033712dab',
    badge: 'new',
    materials: 'Blush and white roses, low glass cube',
    processing: '1-2 business days',
    freeShipping: true,
    stock: 12,
    sales: 74,
    tags: ['anniversary', 'blush roses', 'low vase', 'romantic']
  },
  {
    id: 'classic-red-anniversary-roses',
    name: 'Classic Red Anniversary Roses',
    price: 1590,
    sellerId: 'bloom-petals',
    categoryId: 'bouquets',
    rating: 4.9,
    reviews: 81,
    description:
      'Long-stem red roses with a satin bow, presented in a clear sleeve. The anniversary classic for a reason.',
    photo: 'photo-1696238404375-2f7c1734131b',
    badge: 'bestseller',
    materials: 'Long-stem red roses, satin bow, clear sleeve',
    processing: 'Same-day for orders before 12nn',
    freeShipping: true,
    stock: 15,
    sales: 342,
    tags: ['anniversary', 'red roses', 'classic', 'romantic']
  },
  {
    id: 'rose-basket-anniversary',
    name: 'Anniversary Rose Basket',
    price: 1790,
    sellerId: 'bloom-petals',
    categoryId: 'bouquets',
    rating: 4.7,
    reviews: 27,
    description:
      'Red roses and eucalyptus planted in a woven basket with a water reservoir. It keeps giving for weeks.',
    photo: 'photo-1660675865775-15b4a15d1a68',
    badge: null,
    materials: 'Red roses, eucalyptus, woven basket, water reservoir',
    processing: '3-4 business days',
    freeShipping: true,
    stock: 8,
    sales: 67,
    tags: ['anniversary', 'basket', 'red roses', 'long lasting']
  },
  {
    id: 'golden-years-anniversary-bouquet',
    name: 'Golden Years Anniversary Bouquet',
    price: 1190,
    compareAt: 1350,
    sellerId: 'bloom-petals',
    categoryId: 'bouquets',
    rating: 4.8,
    reviews: 48,
    description:
      'A warm mix of amber, cream, and blush blooms tied with jute. Made for milestone years and quiet Sundays.',
    photo: 'photo-1531120364508-a6b656c3e78d',
    badge: 'sale',
    materials: 'Amber, cream and blush blooms, jute twine',
    processing: '1-2 business days',
    freeShipping: true,
    stock: 17,
    sales: 152,
    tags: ['anniversary', 'milestone', 'warm tones', 'hand tied']
  },
  {
    id: 'violet-anniversary-bouquet',
    name: 'Violet Anniversary Bouquet',
    price: 1150,
    sellerId: 'bloom-petals',
    categoryId: 'bouquets',
    rating: 4.6,
    reviews: 25,
    description:
      'Purple lisianthus and stock with silver foliage, wrapped in violet tissue paper.',
    photo: 'photo-1615543329594-675395aaf885',
    badge: null,
    materials: 'Lisianthus, stock, silver foliage, tissue wrap',
    processing: '2-3 business days',
    freeShipping: true,
    stock: 14,
    sales: 58,
    tags: ['anniversary', 'purple', 'lisianthus', 'hand tied']
  },
  /* ---- Bouquets & Blooms ---- */
  {
    id: 'everlasting-dried-arrangement',
    name: 'Everlasting Dried Flower Arrangement',
    price: 549,
    sellerId: 'bloom-petals',
    categoryId: 'bouquets',
    rating: 4.8,
    reviews: 210,
    description:
      'Preserved bunny tails, fan palm, and gyp tied into a milk-can arrangement that stays beautiful for months.',
    photo: 'photo-1674541657661-33d94e362d9b',
    badge: 'bestseller',
    materials: 'Dried bunny tail, fan palm, gyp, galvanised tin',
    processing: '1-2 business days',
    freeShipping: true,
    stock: 24,
    sales: 640,
    tags: ['dried flowers', 'everlasting', 'home decor', 'gift']
  },
  {
    id: 'fresh-bloom-bouquet',
    name: 'Fresh Bloom Bouquet in Kraft Wrap',
    price: 899,
    compareAt: 999,
    sellerId: 'bloom-petals',
    categoryId: 'bouquets',
    rating: 4.7,
    reviews: 160,
    description:
      'A fresh-cut bundle of seasonal blooms wrapped in kraft paper and finished with a hand-written message card.',
    photo: 'photo-1771121412135-c4f0c24fe677',
    badge: 'sale',
    materials: 'Seasonal cut flowers, kraft wrap, twine',
    processing: 'Same-day for orders before 12nn',
    freeShipping: true,
    stock: 18,
    sales: 410,
    tags: ['fresh flowers', 'birthday', 'anniversary', 'gift']
  },
  {
    id: 'mini-rose-bunch',
    name: 'Mini Rose Bunch',
    price: 350,
    sellerId: 'bloom-petals',
    categoryId: 'bouquets',
    rating: 4.5,
    reviews: 95,
    description:
      'A pocket-sized bunch of sprayed pink roses — the little something for desks, lockers, and bedside tables.',
    photo: 'photo-1644248423203-80e317d78aee',
    badge: null,
    materials: 'Sprayed roses, tissue wrap',
    processing: '1-2 business days',
    freeShipping: false,
    stock: 40,
    sales: 265,
    tags: ['roses', 'small gift', 'desk', 'budget']
  },
  {
    id: 'sweetheart-hand-bouquet',
    name: 'Sweetheart Hand Bouquet',
    price: 650,
    sellerId: 'bloom-petals',
    categoryId: 'bouquets',
    rating: 4.9,
    reviews: 132,
    description:
      'Roses, ranunculus, and eucalyptus cradled in a hand-tied bunch — made to order and photographed before it ships.',
    photo: 'photo-1526047932273-341f2a7631f9',
    badge: 'bestseller',
    materials: 'Roses, ranunculus, eucalyptus, ribbon',
    processing: '1-2 business days',
    freeShipping: true,
    stock: 15,
    sales: 380,
    tags: ['roses', 'valentine', 'anniversary', 'hand-tied']
  },
  {
    id: 'market-fresh-wrap',
    name: 'Market Fresh Wrap',
    price: 799,
    sellerId: 'bloom-petals',
    categoryId: 'bouquets',
    rating: 4.6,
    reviews: 88,
    description:
      'Our market-bucket mix: whatever is blooming that morning, bucketed and wrapped for a generous, unstudied look.',
    photo: 'photo-1487070183336-b863922373d4',
    badge: 'new',
    materials: 'Mixed seasonal stems, bucket option available',
    processing: '1-2 business days',
    freeShipping: true,
    stock: 12,
    sales: 120,
    tags: ['mixed flowers', 'market', 'housewarming']
  },

  {
    id: 'sunflower-day-bouquet',
    name: 'Sunflower Day Bouquet',
    price: 749,
    sellerId: 'bloom-petals',
    categoryId: 'bouquets',
    rating: 4.8,
    reviews: 148,
    description:
      'A cheerful armful of sunflowers and eucalyptus finished with a twine bow — built for kitchen tables and congratulations.',
    photo: 'photo-1601884928885-92a922f7962f',
    badge: 'bestseller',
    materials: 'Fresh sunflowers, eucalyptus, kraft wrap, twine',
    processing: 'Same-day for orders before 12nn',
    freeShipping: true,
    stock: 26,
    sales: 520,
    tags: ['sunflowers', 'birthday', 'celebration', 'bright']
  },
  {
    id: 'blush-peony-bouquet',
    name: 'Blush Peony Bouquet',
    price: 1290,
    compareAt: 1450,
    sellerId: 'bloom-petals',
    categoryId: 'bouquets',
    rating: 4.9,
    reviews: 86,
    description:
      'Full-blown blush peonies layered three deep and tied with silk ribbon — our most requested anniversary arrangement.',
    photo: 'photo-1558021843-f9ab317ed0eb',
    badge: 'sale',
    materials: 'Fresh peonies, ruscus, silk ribbon',
    processing: '1-2 business days',
    freeShipping: true,
    stock: 12,
    sales: 305,
    tags: ['peonies', 'anniversary', 'romantic', 'luxury']
  },
  {
    id: 'wrapped-spring-tulips',
    name: 'Spring Tulips in Paper Wrap',
    price: 690,
    sellerId: 'bloom-petals',
    categoryId: 'bouquets',
    rating: 4.6,
    reviews: 74,
    description:
      'Twenty stems of pink and coral tulips wrapped in recycled brown paper — simple, generous, and easy to carry home.',
    photo: 'photo-1679944587532-12ae548a133e',
    badge: 'new',
    materials: 'Fresh tulips, recycled kraft wrap',
    processing: 'Same-day for orders before 12nn',
    freeShipping: false,
    stock: 30,
    sales: 190,
    tags: ['tulips', 'spring', 'simple', 'gift']
  },

  {
    id: 'photo-ref-magnets-set-of-6',
    name: 'Photo Ref Magnets, Set of 6',
    price: 349,
    sellerId: 'snapmemory',
    categoryId: 'photo-gifts',
    rating: 4.9,
    reviews: 124,
    description:
      'Six glossy magnets printed from your own photos, strong enough to hold a stack of paper on a steel fridge door.',
    photo: 'photo-1487770931682-b80013ed9cc9',
    badge: 'bestseller',
    materials: 'Glossy photo paper, flexible magnet sheet',
    processing: '2-3 business days',
    freeShipping: false,
    stock: 85,
    sales: 690,
    tags: ['photo magnets', 'fridge magnets', 'photo gift', 'set of six']
  },
  {
    id: 'polaroid-ref-magnet-set',
    name: 'Polaroid Style Ref Magnets, Set of 8',
    price: 399,
    sellerId: 'snapmemory',
    categoryId: 'photo-gifts',
    rating: 4.8,
    reviews: 63,
    description:
      'Eight magnets styled like instant prints with a white border, so your fridge looks like a photo wall.',
    photo: 'photo-1612547036242-77002603e5aa',
    badge: 'new',
    materials: 'Matte photo stock, flexible magnet sheet',
    processing: '2-3 business days',
    freeShipping: false,
    stock: 62,
    sales: 248,
    tags: ['photo magnets', 'polaroid style', 'fridge', 'photo gift']
  },
  {
    id: 'table-calendar-2027',
    name: 'Photo Table Calendar 2027',
    price: 549,
    sellerId: 'snapmemory',
    categoryId: 'photo-gifts',
    rating: 4.9,
    reviews: 97,
    description:
      'A twelve month table calendar on thick matte stock with a wire stand. Add one photo for each month.',
    photo: 'photo-1631972756622-b2d9164c0e53',
    badge: 'bestseller',
    materials: '300gsm matte stock, wire stand, soy ink',
    processing: '3-4 business days',
    freeShipping: true,
    stock: 48,
    sales: 415,
    tags: ['table calendar', 'photo calendar', '2027', 'desk']
  },
  {
    id: 'spiral-desk-calendar',
    name: 'Spiral Desk Calendar with Your Photos',
    price: 499,
    compareAt: 599,
    sellerId: 'snapmemory',
    categoryId: 'photo-gifts',
    rating: 4.7,
    reviews: 58,
    description:
      'Spiral bound desk calendar with a fold-out stand, printed single side on 300gsm paper.',
    photo: 'photo-1535981767287-35259dbf7d0e',
    badge: 'sale',
    materials: '300gsm paper, spiral binding, fold-out stand',
    processing: '3-4 business days',
    freeShipping: true,
    stock: 55,
    sales: 263,
    tags: ['desk calendar', 'spiral', 'photo calendar', 'budget']
  },
  {
    id: 'wood-stand-photo-calendar',
    name: 'Wood Stand Photo Calendar',
    price: 649,
    sellerId: 'snapmemory',
    categoryId: 'photo-gifts',
    rating: 4.8,
    reviews: 44,
    description:
      'Twelve of your photos bound into a calendar that sits on a slim wooden base. A gift people actually keep.',
    photo: 'photo-1631972757546-a9c28c924c2b',
    badge: null,
    materials: 'Matte photo stock, birch stand, wire coil',
    processing: '3-4 business days',
    freeShipping: true,
    stock: 36,
    sales: 187,
    tags: ['table calendar', 'wood stand', 'photo calendar', 'gift']
  },
  {
    id: 'minimal-desk-calendar',
    name: 'Minimal Photo Desk Calendar',
    price: 459,
    sellerId: 'snapmemory',
    categoryId: 'photo-gifts',
    rating: 4.6,
    reviews: 39,
    description:
      'A clean, type-led desk calendar with a small photo slot for each month. Neutral enough for any desk.',
    photo: 'photo-1640116565640-51de47c7791b',
    badge: 'new',
    materials: 'Uncoated 300gsm stock, wire easel',
    processing: '2-3 business days',
    freeShipping: true,
    stock: 44,
    sales: 96,
    tags: ['desk calendar', 'minimal', 'photo calendar', 'office']
  },
  {
    id: 'monochrome-wall-desk-calendar',
    name: 'Monochrome Wall and Desk Calendar',
    price: 599,
    sellerId: 'snapmemory',
    categoryId: 'photo-gifts',
    rating: 4.7,
    reviews: 31,
    description:
      'Matte monochrome printing with a grid layout, usable on a wall pin or a desk easel.',
    photo: 'photo-1718815628185-2ff0f9332b32',
    badge: null,
    materials: 'Uncoated stock, hanging loop, desk easel',
    processing: '3-4 business days',
    freeShipping: true,
    stock: 30,
    sales: 104,
    tags: ['wall calendar', 'monochrome', 'photo calendar', 'grid']
  },
  {
    id: 'twelve-month-photo-calendar',
    name: 'Twelve Month Photo Calendar',
    price: 579,
    sellerId: 'snapmemory',
    categoryId: 'photo-gifts',
    rating: 4.9,
    reviews: 52,
    description:
      'Pick twelve photos, one for each month. We set the dates, the holidays, and the captions for you.',
    photo: 'photo-1640116565729-b5f5befc7260',
    badge: 'new',
    materials: '300gsm matte stock, wire binding, easel',
    processing: '3-4 business days',
    freeShipping: true,
    stock: 41,
    sales: 138,
    tags: ['photo calendar', 'table calendar', 'custom dates', 'gift']
  },
  /* ---- Photo Gifts ---- */
  {
    id: 'printed-magnetic-photo',
    name: 'Printed Magnetic Photo (Square)',
    price: 199,
    sellerId: 'snapmemory',
    categoryId: 'photo-gifts',
    rating: 4.9,
    reviews: 300,
    description:
      'Glossy photo printed on a fridge magnet. Upload any image — we colour-check it and send a proof before printing.',
    photo: 'photo-1500051638674-ff996a0ec29e',
    badge: 'bestseller',
    materials: 'Gloss photo paper, flexible magnet',
    processing: '2-3 business days',
    freeShipping: true,
    stock: 200,
    sales: 1840,
    tags: ['magnet', 'photo gift', 'custom', 'fridge']
  },
  {
    id: 'magnetic-photo-set-of-4',
    name: 'Magnetic Photo Set of 4',
    price: 650,
    compareAt: 750,
    sellerId: 'snapmemory',
    categoryId: 'photo-gifts',
    rating: 4.8,
    reviews: 180,
    description:
      'Four coordinating magnetic prints in one pack — build a mini gallery right on the fridge door.',
    photo: 'photo-1771681625705-e6fcc490c8c9',
    badge: 'sale',
    materials: 'Gloss photo paper, flexible magnet',
    processing: '2-3 business days',
    freeShipping: true,
    stock: 120,
    sales: 720,
    tags: ['magnet', 'set', 'photo gift', 'family']
  },
  {
    id: 'polaroid-magnetic-photos',
    name: 'Polaroid-Style Magnetic Photos (3pc)',
    price: 399,
    sellerId: 'snapmemory',
    categoryId: 'photo-gifts',
    rating: 4.6,
    reviews: 240,
    description:
      'Three vintage polaroid-style prints with a magnetic back and a white border that never fades.',
    photo: 'photo-1755444314262-2e6c7ea83b98',
    badge: null,
    materials: 'Matte photo paper, magnetic backing',
    processing: '2-3 business days',
    freeShipping: false,
    stock: 150,
    sales: 980,
    tags: ['polaroid', 'vintage', 'magnet', 'aesthetic']
  },
  {
    id: 'framed-photo-print-set',
    name: 'Framed Photo Print Set (3pc)',
    price: 899,
    sellerId: 'snapmemory',
    categoryId: 'photo-gifts',
    rating: 4.8,
    reviews: 96,
    description:
      'Three gallery-quality prints in slim frames, ready to hang. Send three photos or choose from our layout templates.',
    photo: 'photo-1513519245088-0e12902e5a38',
    badge: 'new',
    materials: 'Archival print, pine frame, glass front',
    processing: '3-5 business days',
    freeShipping: true,
    stock: 35,
    sales: 210,
    tags: ['frames', 'wall art', 'gallery', 'housewarming']
  },

  {
    id: 'layflat-photo-book',
    name: 'Layflat Photo Book (30 Pages)',
    price: 1450,
    sellerId: 'snapmemory',
    categoryId: 'photo-gifts',
    rating: 4.9,
    reviews: 124,
    description:
      'A layflat-bound album that opens wide for full-bleed spreads. Send up to 90 photos and we proof every page by eye.',
    photo: 'photo-1646645733353-55c8bfb60a70',
    badge: 'bestseller',
    materials: 'Matte photographic paper, layflat binding, linen cover',
    processing: '3-4 business days',
    freeShipping: true,
    stock: 40,
    sales: 480,
    tags: ['photo book', 'album', 'wedding', 'family']
  },
  {
    id: 'linen-memory-album',
    name: 'Linen Memory Album',
    price: 1890,
    sellerId: 'snapmemory',
    categoryId: 'photo-gifts',
    rating: 4.7,
    reviews: 58,
    description:
      'A heavyweight linen album with self-adhesive pages and glassine interleaves — made for the box of prints you actually want to keep.',
    photo: 'photo-1694022861804-840f61d1c452',
    badge: null,
    materials: 'Linen cloth, archival board, glassine sheets',
    processing: '3-4 business days',
    freeShipping: false,
    stock: 16,
    sales: 140,
    tags: ['album', 'keepsake', 'heritage', 'gift']
  },
  {
    id: 'retro-instant-print-pack',
    name: 'Retro Instant Print Pack of 12',
    price: 320,
    sellerId: 'snapmemory',
    categoryId: 'photo-gifts',
    rating: 4.6,
    reviews: 210,
    description:
      'Twelve instant-style prints with the classic white border, printed on glossy stock and shipped flat in a rigid envelope.',
    photo: 'photo-1516962126636-27ad087061cc',
    badge: 'new',
    materials: 'Glossy photo stock, white instant border',
    processing: '2-3 business days',
    freeShipping: false,
    stock: 120,
    sales: 640,
    tags: ['instant prints', 'polaroid', 'dorm', 'budget']
  },

  {
    id: 'minimalist-metal-keyring',
    name: 'Minimalist Metal Keyring',
    price: 249,
    sellerId: 'acrylic-angle',
    categoryId: 'keychains',
    rating: 4.7,
    reviews: 73,
    description:
      'A brushed metal keyring with a flat tag you can stamp with initials. No charms, no noise, just a good weight.',
    photo: 'photo-1603508102977-02688e3265fd',
    badge: null,
    materials: 'Brushed stainless steel, split ring, stamping tag',
    processing: '1-2 business days',
    freeShipping: false,
    stock: 90,
    sales: 430,
    tags: ['keychain', 'metal', 'minimal', 'personalized']
  },
  /* ---- Keychains & Charms ---- */
  {
    id: 'custom-engraved-plate-keychain',
    name: 'Custom Engraved Plate Keychain',
    price: 149,
    sellerId: 'acrylic-angle',
    categoryId: 'keychains',
    rating: 4.9,
    reviews: 420,
    description:
      'A brushed plate engraved with a name, plate number, or short message — clipped to a heavy-duty carabiner.',
    photo: 'photo-1674660638936-c0005c862a0d',
    badge: 'bestseller',
    materials: 'Brushed alloy plate, steel carabiner',
    processing: '1-2 business days',
    freeShipping: true,
    stock: 300,
    sales: 2410,
    tags: ['keychain', 'engraved', 'custom', 'car']
  },
  {
    id: 'key-tag-card-holder',
    name: 'Key Tag & Card Holder',
    price: 229,
    sellerId: 'acrylic-angle',
    categoryId: 'keychains',
    rating: 4.8,
    reviews: 180,
    description:
      'A slim leatherette tag that holds a transit card or house key — one less thing to lose at the turnstile.',
    photo: 'photo-1676276550349-580c49631496',
    badge: null,
    materials: 'Leatherette, alloy ring',
    processing: '1-3 business days',
    freeShipping: false,
    stock: 90,
    sales: 540,
    tags: ['keychain', 'card holder', 'everyday', 'gift']
  },
  {
    id: 'vintage-heart-keychain',
    name: 'Vintage Heart Keychain',
    price: 179,
    sellerId: 'acrylic-angle',
    categoryId: 'keychains',
    rating: 4.7,
    reviews: 280,
    description:
      'An embossed heart charm in antique brass — small enough to forget, sentimental enough to keep.',
    photo: 'photo-1727154085760-134cc942246e',
    badge: null,
    materials: 'Antique brass alloy',
    processing: '1-2 business days',
    freeShipping: false,
    stock: 140,
    sales: 890,
    tags: ['keychain', 'heart', 'anniversary', 'charm']
  },

  {
    id: 'couple-initial-keychain',
    name: 'Pair of Initial Keychains',
    price: 349,
    sellerId: 'acrylic-angle',
    categoryId: 'keychains',
    rating: 4.8,
    reviews: 168,
    description:
      'Two brushed-metal keychains cut with a single initial each — one for you, one for them, both stamped to order.',
    photo: 'photo-1687363714985-990685339050',
    badge: 'bestseller',
    materials: 'Stainless steel, split ring, laser stamping',
    processing: '2-3 business days',
    freeShipping: false,
    stock: 85,
    sales: 720,
    tags: ['couple', 'initial', 'personalized', 'gift']
  },
  {
    id: 'housewarming-door-keyring',
    name: 'Housewarming Door Keyring',
    price: 229,
    sellerId: 'acrylic-angle',
    categoryId: 'keychains',
    rating: 4.5,
    reviews: 62,
    description:
      'A slim tag keyring engraved with an address and move-in date — the gift new homeowners actually leave on the door.',
    photo: 'photo-1714631281605-a849ba8e90b5',
    badge: null,
    materials: 'Anodised aluminium, steel split ring',
    processing: '2-3 business days',
    freeShipping: false,
    stock: 95,
    sales: 240,
    tags: ['housewarming', 'engraved', 'new home', 'practical']
  },
  {
    id: 'anime-charm-keychain',
    name: 'Anime Figure Charm Keychain',
    price: 279,
    compareAt: 349,
    sellerId: 'acrylic-angle',
    categoryId: 'keychains',
    rating: 4.4,
    reviews: 143,
    description:
      'A double-sided acrylic charm with a matte finish and a sturdy lobster clasp — built for bags, lanyards, and pencil cases.',
    photo: 'photo-1741254720220-5fec5d24b546',
    badge: 'sale',
    materials: 'Matte acrylic, lobster clasp, printed insert',
    processing: '1-2 business days',
    freeShipping: false,
    stock: 140,
    sales: 580,
    tags: ['anime', 'acrylic', 'charm', 'bag']
  },

  {
    id: 'crochet-animal-pair',
    name: 'Crochet Animal Pair',
    price: 690,
    sellerId: 'handworks-ph',
    categoryId: 'handmade',
    rating: 4.9,
    reviews: 68,
    description:
      'Two hand-crocheted amigurumi animals worked in cotton yarn. Each pair is stitched to order.',
    photo: 'photo-1686151573986-03b5a79f22a5',
    badge: 'bestseller',
    materials: 'Cotton yarn, polyester fill, safety eyes',
    processing: '3-4 business days',
    freeShipping: true,
    stock: 26,
    sales: 265,
    tags: ['crochet', 'amigurumi', 'handmade', 'pair']
  },
  {
    id: 'crochet-brown-bear-cub',
    name: 'Crochet Brown Bear Cub',
    price: 450,
    sellerId: 'handworks-ph',
    categoryId: 'handmade',
    rating: 4.8,
    reviews: 51,
    description:
      'A palm-sized crocheted bear with embroidered eyes and a stitched nose. Safe for small hands.',
    photo: 'photo-1626241803094-88edd8ae6453',
    badge: null,
    materials: 'Cotton yarn, polyester fill, embroidery thread',
    processing: '3-4 business days',
    freeShipping: false,
    stock: 34,
    sales: 198,
    tags: ['crochet', 'bear', 'amigurumi', 'plush']
  },
  {
    id: 'crochet-pink-bunny',
    name: 'Crochet Pink Bunny',
    price: 480,
    compareAt: 550,
    sellerId: 'handworks-ph',
    categoryId: 'handmade',
    rating: 4.7,
    reviews: 47,
    description:
      'A floppy-eared crochet bunny in soft pink cotton, stitched with a blanket-stitch detail along the back.',
    photo: 'photo-1744371760034-fb60ebd2b198',
    badge: 'sale',
    materials: 'Soft cotton yarn, polyester fill, ribbon',
    processing: '3-4 business days',
    freeShipping: false,
    stock: 29,
    sales: 164,
    tags: ['crochet', 'bunny', 'amigurumi', 'gift']
  },
  /* ---- Handmade Crafts ---- */
  {
    id: 'crochet-turtle-plush',
    name: 'Crochet Turtle Plush',
    price: 450,
    sellerId: 'handworks-ph',
    categoryId: 'handmade',
    rating: 4.9,
    reviews: 120,
    description:
      'A one-of-a-kind crocheted turtle in soft cotton yarn, stuffed by hand with embroidered eyes that never scratch.',
    photo: 'photo-1671212684942-5c8a3dc3234e',
    badge: 'bestseller',
    materials: 'Cotton yarn, polyfill, safety eyes',
    processing: '3-5 business days',
    freeShipping: true,
    stock: 22,
    sales: 340,
    tags: ['crochet', 'plush', 'kids', 'amigurumi']
  },
  {
    id: 'handwoven-market-tote',
    name: 'Handwoven Market Tote',
    price: 780,
    sellerId: 'handworks-ph',
    categoryId: 'handmade',
    rating: 4.7,
    reviews: 88,
    description:
      'A sturdy woven tote in natural fibres with rolled handles and a zippered pocket for the things that fall out.',
    photo: 'photo-1524679813234-66a389fe1a42',
    badge: null,
    materials: 'Woven abaca blend, cotton lining',
    processing: '2-4 business days',
    freeShipping: true,
    stock: 30,
    sales: 260,
    tags: ['tote', 'bag', 'woven', 'market']
  },
  {
    id: 'beaded-stack-bracelets',
    name: 'Beaded Stack Bracelets (Set of 3)',
    price: 220,
    sellerId: 'handworks-ph',
    categoryId: 'handmade',
    rating: 4.6,
    reviews: 310,
    description:
      'Three hand-strung stacks on adjustable cord — worn together or split across friends. Made to order in your colours.',
    photo: 'photo-1766560360087-b97dc4cc40c7',
    badge: null,
    materials: 'Glass beads, elastic cord',
    processing: '1-3 business days',
    freeShipping: false,
    stock: 160,
    sales: 1120,
    tags: ['bracelet', 'beads', 'friendship', 'stack']
  },
  {
    id: 'wooden-artist-figurine',
    name: 'Hand-Carved Wooden Mannequin',
    price: 550,
    sellerId: 'handworks-ph',
    categoryId: 'handmade',
    rating: 4.8,
    reviews: 64,
    description:
      'A posable, hand-carved figure sealed with natural oil — equally happy on a shelf or a drawing desk.',
    photo: 'photo-1598379873226-a9bd21912e5d',
    badge: null,
    materials: 'Solid rubberwood, natural oil finish',
    processing: '2-4 business days',
    freeShipping: true,
    stock: 26,
    sales: 180,
    tags: ['wood', 'carved', 'desk', 'artist']
  },

  {
    id: 'crochet-bear-plush',
    name: 'Crochet Bear Plush',
    price: 590,
    sellerId: 'handworks-ph',
    categoryId: 'handmade',
    rating: 4.9,
    reviews: 96,
    description:
      'A hand-crocheted cotton bear with embroidered features — no plastic eyes, so it is safe for tiny hands.',
    photo: 'photo-1627693685101-687bf0eb1222',
    badge: 'bestseller',
    materials: 'Cotton yarn, polyester fill, embroidery thread',
    processing: '4-6 business days',
    freeShipping: false,
    stock: 22,
    sales: 380,
    tags: ['crochet', 'plush', 'baby', 'handmade']
  },
  {
    id: 'crochet-bunny-plush',
    name: 'Crochet Bunny Plush',
    price: 590,
    sellerId: 'handworks-ph',
    categoryId: 'handmade',
    rating: 4.8,
    reviews: 71,
    description:
      'A soft grey-and-white bunny with long ears and a stitched nose, worked in the same cotton yarn as our bear.',
    photo: 'photo-1629019317873-3f603b269723',
    badge: null,
    materials: 'Cotton yarn, polyester fill, embroidery thread',
    processing: '4-6 business days',
    freeShipping: false,
    stock: 24,
    sales: 300,
    tags: ['crochet', 'bunny', 'nursery', 'handmade']
  },
  {
    id: 'crochet-ornament-garland',
    name: 'Crochet Ornament Garland',
    price: 380,
    sellerId: 'handworks-ph',
    categoryId: 'handmade',
    rating: 4.7,
    reviews: 44,
    description:
      'Five hand-crocheted baubles on a cotton cord — strung across a shelf, a crib, or a party table in one minute.',
    photo: 'photo-1682456138620-6076ac071b51',
    badge: 'new',
    materials: 'Cotton yarn, cotton cord, polyfill',
    processing: '3-4 business days',
    freeShipping: true,
    stock: 35,
    sales: 165,
    tags: ['garland', 'decor', 'party', 'crochet']
  },

  {
    id: 'keepsake-conch-display',
    name: 'Keepsake Conch Shelf Display',
    price: 390,
    sellerId: 'baybay-souvenirs',
    categoryId: 'coastal',
    rating: 4.8,
    reviews: 36,
    description:
      'A single curated conch, cleaned, sealed, and mounted on a clear acrylic stand for a shelf or a desk.',
    photo: 'photo-1650012332958-2aa054c850ff',
    badge: 'new',
    materials: 'Natural conch, sealant, acrylic stand',
    processing: '2-3 business days',
    freeShipping: false,
    stock: 22,
    sales: 87,
    tags: ['seashell', 'conch', 'coastal decor', 'souvenir']
  },
  /* ---- Coastal Souvenirs ---- */
  {
    id: 'shell-wind-chime',
    name: 'Shell Wind Chime',
    price: 480,
    sellerId: 'baybay-souvenirs',
    categoryId: 'coastal',
    rating: 4.7,
    reviews: 140,
    description:
      'Sun-bleached shells strung along driftwood — it clicks and hums whenever the window is open.',
    photo: 'photo-1754873800920-d1f505753f55',
    badge: null,
    materials: 'Collected shells, driftwood, cotton cord',
    processing: '2-4 business days',
    freeShipping: true,
    stock: 45,
    sales: 390,
    tags: ['souvenir', 'shells', 'beach', 'home decor']
  },
  {
    id: 'woven-straw-souvenir-hat',
    name: 'Woven Straw Souvenir Hat',
    price: 690,
    sellerId: 'baybay-souvenirs',
    categoryId: 'coastal',
    rating: 4.5,
    reviews: 76,
    description:
      'A handwoven raffia brim with a contrast band and chin strap — packable, breathable, beach-approved.',
    photo: 'photo-1745284504942-2eb53650360a',
    badge: null,
    materials: 'Raffia straw, cotton band',
    processing: '2-4 business days',
    freeShipping: false,
    stock: 38,
    sales: 210,
    tags: ['hat', 'raffia', 'beach', 'souvenir']
  },
  {
    id: 'hand-painted-keepsake-vase',
    name: 'Hand-Painted Keepsake Vase',
    price: 320,
    sellerId: 'baybay-souvenirs',
    categoryId: 'coastal',
    rating: 4.6,
    reviews: 105,
    description:
      'A small ceramic vase painted with coastal motifs — each one signed by the maker on the base.',
    photo: 'photo-1753957012011-080e80aaec21',
    badge: null,
    materials: 'Ceramic, hand-mixed glaze',
    processing: '2-4 business days',
    freeShipping: false,
    stock: 52,
    sales: 330,
    tags: ['vase', 'painted', 'souvenir', 'ceramic']
  },

  {
    id: 'starfish-shell-frame',
    name: 'Starfish & Shell Shadow-Box Frame',
    price: 640,
    sellerId: 'baybay-souvenirs',
    categoryId: 'coastal',
    rating: 4.8,
    reviews: 88,
    description:
      'A curated starfish and shell arrangement set into a deep shadow box — ready to hang, no sand required.',
    photo: 'photo-1645618988993-f5ac73b5028a',
    badge: 'bestseller',
    materials: 'Natural starfish and shells, glass-fronted shadow box',
    processing: '2-3 business days',
    freeShipping: true,
    stock: 30,
    sales: 410,
    tags: ['starfish', 'frame', 'beach house', 'souvenir']
  },
  {
    id: 'seashell-glass-vase',
    name: 'Seashell Glass Vase Accent',
    price: 495,
    sellerId: 'baybay-souvenirs',
    categoryId: 'coastal',
    rating: 4.6,
    reviews: 57,
    description:
      'A single sculptural seashell displayed on a clear glass stand — a small piece of shoreline for a desk or bedside table.',
    photo: 'photo-1596743731098-109876619ec1',
    badge: null,
    materials: 'Natural seashell, clear glass stand',
    processing: '1-2 business days',
    freeShipping: false,
    stock: 48,
    sales: 220,
    tags: ['shell', 'shelf', 'minimal', 'souvenir']
  },
  {
    id: 'assorted-shell-craft-set',
    name: 'Assorted Seashell Craft Set',
    price: 310,
    sellerId: 'baybay-souvenirs',
    categoryId: 'coastal',
    rating: 4.5,
    reviews: 64,
    description:
      'Thirty sorted shells in graded sizes, cleaned and ready for wreaths, frames, and school projects.',
    photo: 'photo-1751150760592-2a3125bfd42d',
    badge: 'new',
    materials: 'Assorted natural seashells, cotton pouch',
    processing: '1-2 business days',
    freeShipping: false,
    stock: 70,
    sales: 260,
    tags: ['craft', 'shells', 'diy', 'kids']
  },

  {
    id: 'trio-soy-candle-set',
    name: 'Trio Soy Candle Set',
    price: 790,
    sellerId: 'clay-kiln',
    categoryId: 'home',
    rating: 4.9,
    reviews: 89,
    description:
      'Three soy candles in matching jars with a forty hour burn time each. Coconut, calamansi, and linen scents.',
    photo: 'photo-1705417929633-19d68b4e72a3',
    badge: 'bestseller',
    materials: 'Soy wax, cotton wick, essential oil blend',
    processing: '2-3 business days',
    freeShipping: true,
    stock: 38,
    sales: 374,
    tags: ['candles', 'soy wax', 'gift set', 'home fragrance']
  },
  {
    id: 'woven-market-basket',
    name: 'Woven Market Basket',
    price: 850,
    sellerId: 'clay-kiln',
    categoryId: 'home',
    rating: 4.7,
    reviews: 42,
    description:
      'A sturdy woven basket with rolled handles, sized for market runs, picnics, or blanket storage.',
    photo: 'photo-1601330862030-1e08c703ac04',
    badge: null,
    materials: 'Natural woven fibre, rolled handles',
    processing: '3-4 business days',
    freeShipping: true,
    stock: 24,
    sales: 151,
    tags: ['basket', 'storage', 'woven', 'picnic']
  },
  /* ---- Home & Decor ---- */
  {
    id: 'speckled-ceramic-cup-set',
    name: 'Speckled Ceramic Cup Set (4pc)',
    price: 1150,
    sellerId: 'clay-kiln',
    categoryId: 'home',
    rating: 4.9,
    reviews: 72,
    description:
      'Four wheel-thrown cups in a speckled oat glaze — stacked they look like a little architecture project.',
    photo: 'photo-1610701596007-11502861dcfa',
    badge: 'bestseller',
    materials: 'Stoneware clay, food-safe glaze',
    processing: '3-5 business days',
    freeShipping: true,
    stock: 18,
    sales: 240,
    tags: ['ceramic', 'cups', 'kitchen', 'housewarming']
  },
  {
    id: 'amber-glass-soy-candle',
    name: 'Amber Glass Soy Candle',
    price: 545,
    sellerId: 'clay-kiln',
    categoryId: 'home',
    rating: 4.8,
    reviews: 154,
    description:
      'Hand-poured soy wax with a warm amber-and-cedar scent and a 45-hour burn in a reusable glass tumbler.',
    photo: 'photo-1603006905003-be475563bc59',
    badge: null,
    materials: 'Soy wax, cotton wick, amber glass',
    processing: '2-4 business days',
    freeShipping: true,
    stock: 64,
    sales: 610,
    tags: ['candle', 'soy', 'scent', 'gift']
  },
  {
    id: 'stoneware-bud-vase-set',
    name: 'Stoneware Bud Vase Set (3pc)',
    price: 690,
    sellerId: 'clay-kiln',
    categoryId: 'home',
    rating: 4.7,
    reviews: 61,
    description:
      'Three matte stoneware buds in graduated heights — one stem each, or all three down the middle of a table.',
    photo: 'photo-1565193566173-7a0ee3dbe261',
    badge: 'new',
    materials: 'Stoneware, matte glaze',
    processing: '3-5 business days',
    freeShipping: true,
    stock: 25,
    sales: 130,
    tags: ['vase', 'stoneware', 'decor', 'set']
  },

  {
    id: 'matte-black-candle-holder',
    name: 'Matte Black Candle Holder',
    price: 640,
    sellerId: 'clay-kiln',
    categoryId: 'home',
    rating: 4.8,
    reviews: 79,
    description:
      'A hand-glazed stoneware holder with a matte black finish — takes a standard taper and does not tip.',
    photo: 'photo-1585469434345-c26ede18819b',
    badge: 'new',
    materials: 'Hand-glazed stoneware, matte black finish',
    processing: '2-3 business days',
    freeShipping: true,
    stock: 34,
    sales: 245,
    tags: ['candle holder', 'stoneware', 'dinner table', 'decor']
  },
  {
    id: 'round-woven-storage-basket',
    name: 'Round Woven Storage Basket',
    price: 780,
    sellerId: 'clay-kiln',
    categoryId: 'home',
    rating: 4.7,
    reviews: 66,
    description:
      'A low round basket with a soft weave and a reinforced rim — holds throws, magazines, or the laundry you keep meaning to fold.',
    photo: 'photo-1626037235530-fe56de7d6459',
    badge: null,
    materials: 'Natural fibre weave, cotton lining',
    processing: '2-3 business days',
    freeShipping: false,
    stock: 42,
    sales: 310,
    tags: ['basket', 'storage', 'living room', 'organize']
  },
  {
    id: 'soy-candle-in-ceramic-dish',
    name: 'Hand-Poured Soy Candle in Ceramic Dish',
    price: 420,
    compareAt: 495,
    sellerId: 'clay-kiln',
    categoryId: 'home',
    rating: 4.6,
    reviews: 112,
    description:
      'A coconut-soy candle in a reusable glazed dish, poured in small batches and cured for two weeks so it burns evenly to the edge.',
    photo: 'photo-1716819685618-2f7abb7fbed2',
    badge: 'sale',
    materials: 'Coconut-soy wax, cotton wick, glazed ceramic dish',
    processing: '1-2 business days',
    freeShipping: false,
    stock: 55,
    sales: 470,
    tags: ['candle', 'soy', 'aromatherapy', 'gift']
  },

  {
    id: 'junk-journal-starter-kit',
    name: 'Junk Journal Starter Kit',
    price: 745,
    sellerId: 'paper-trail',
    categoryId: 'paper',
    rating: 4.9,
    reviews: 77,
    description:
      'A handmade journal plus a pack of vintage papers, washi, and ephemera so you can start straight away.',
    photo: 'photo-1685478237703-efe7b5f237c8',
    badge: 'bestseller',
    materials: 'Handbound journal, vintage papers, washi tape, ephemera',
    processing: '3-4 business days',
    freeShipping: true,
    stock: 20,
    sales: 289,
    tags: ['journal', 'stationery', 'craft kit', 'gift']
  },
  {
    id: 'minimal-desk-writing-set',
    name: 'Minimal Desk Writing Set',
    price: 425,
    sellerId: 'paper-trail',
    categoryId: 'paper',
    rating: 4.7,
    reviews: 54,
    description:
      'A5 notebook, gel pen, and a set of paper clips in a kraft sleeve. The desk upgrade that fits a drawer.',
    photo: 'photo-1531346479518-1ddeedc3ff77',
    badge: null,
    materials: 'A5 notebook, gel pen, paper clips, kraft sleeve',
    processing: '1-2 business days',
    freeShipping: false,
    stock: 64,
    sales: 302,
    tags: ['notebook', 'desk', 'stationery', 'office']
  },
  {
    id: 'layflat-keepsake-journal',
    name: 'Layflat Keepsake Journal',
    price: 585,
    compareAt: 650,
    sellerId: 'paper-trail',
    categoryId: 'paper',
    rating: 4.8,
    reviews: 46,
    description:
      'A layflat bound journal that opens fully flat for pasting photos, tickets, and letters.',
    photo: 'photo-1535954741680-a2e24eb05418',
    badge: 'sale',
    materials: 'Layflat binding, 120gsm acid-free pages, linen cover',
    processing: '2-3 business days',
    freeShipping: true,
    stock: 31,
    sales: 176,
    tags: ['journal', 'layflat', 'scrapbook', 'keepsake']
  },
  /* ---- Paper Goods ---- */
  {
    id: 'personalized-notes-journal',
    name: 'Personalized Notes Journal',
    price: 395,
    sellerId: 'paper-trail',
    categoryId: 'paper',
    rating: 4.8,
    reviews: 143,
    description:
      'A lined journal with your name foiled on the cover and 160 pages that take fountain ink without bleeding.',
    photo: 'photo-1517842645767-c639042777db',
    badge: 'bestseller',
    materials: 'Foil-stamped cover, 120gsm paper',
    processing: '1-2 business days',
    freeShipping: true,
    stock: 110,
    sales: 520,
    tags: ['journal', 'personalized', 'stationery', 'gift']
  },
  {
    id: 'spiral-notebook-duo',
    name: 'Spiral Notebook Duo',
    price: 320,
    sellerId: 'paper-trail',
    categoryId: 'paper',
    rating: 4.6,
    reviews: 98,
    description:
      'Two A5 spiral notebooks — one dot grid, one ruled — with covers stiff enough to write against.',
    photo: 'photo-1531346878377-a5be20888e57',
    badge: null,
    materials: 'Board cover, 100gsm paper, wire binding',
    processing: '1-2 business days',
    freeShipping: false,
    stock: 140,
    sales: 460,
    tags: ['notebook', 'school', 'set', 'stationery']
  },
  {
    id: 'weekly-goals-planner',
    name: 'Weekly Goals Planner',
    price: 450,
    sellerId: 'paper-trail',
    categoryId: 'paper',
    rating: 4.9,
    reviews: 207,
    description:
      'Fifty-two undated weeks with space for three priorities a day — start it in January or start it today.',
    photo: 'photo-1506784983877-45594efa4cbe',
    badge: 'bestseller',
    materials: 'Lay-flat binding, 100gsm paper',
    processing: '1-2 business days',
    freeShipping: true,
    stock: 95,
    sales: 830,
    tags: ['planner', 'goals', 'productivity', 'undated']
  },
  {
    id: 'kraft-gift-wrap-set',
    name: 'Kraft & Ribbon Gift Wrap Set',
    price: 249,
    sellerId: 'paper-trail',
    categoryId: 'paper',
    rating: 4.7,
    reviews: 112,
    description:
      'Three kraft sheets, two satin ribbons, and a stack of gift tags — everything but the tape.',
    photo: 'photo-1513201099705-a9746e1e201f',
    badge: null,
    materials: 'Kraft paper, satin ribbon, card tags',
    processing: '1-2 business days',
    freeShipping: false,
    stock: 180,
    sales: 470,
    tags: ['gift wrap', 'ribbon', 'kraft', 'party']
  },
  {
    id: 'ready-to-gift-box',
    name: 'Ready-to-Gift Box (Set of 2)',
    price: 399,
    compareAt: 475,
    sellerId: 'paper-trail',
    categoryId: 'paper',
    rating: 4.8,
    reviews: 84,
    description:
      'Two rigid gift boxes with gold ribbon already tied — drop something in, write the tag, hand it over.',
    photo: 'photo-1549465220-1a8b9238cd48',
    badge: 'sale',
    materials: 'Rigid board box, satin ribbon',
    processing: '1-2 business days',
    freeShipping: false,
    stock: 70,
    sales: 290,
    tags: ['gift box', 'packaging', 'party', 'set']
  },
  {
    id: 'linen-reading-journal',
    name: 'Linen Reading Journal',
    price: 525,
    sellerId: 'paper-trail',
    categoryId: 'paper',
    rating: 4.6,
    reviews: 57,
    description:
      'Track 100 books with room for quotes, ratings, and a shelf you wish you had space for.',
    photo: 'photo-1544716278-ca5e3f4abd8c',
    badge: 'new',
    materials: 'Linen hardcover, 120gsm paper',
    processing: '1-2 business days',
    freeShipping: true,
    stock: 48,
    sales: 160,
    tags: ['reading', 'journal', 'books', 'gift']
  },

  {
    id: 'letterpress-card-bundle',
    name: 'Letterpress Card Bundle of 8',
    price: 340,
    sellerId: 'paper-trail',
    categoryId: 'paper',
    rating: 4.8,
    reviews: 92,
    description:
      'Eight blank cards pressed into cotton stock with a deep bite — the kind people keep on the mantel.',
    photo: 'photo-1711967151501-10da09b1f174',
    badge: 'bestseller',
    materials: '300gsm cotton card, letterpress ink, kraft envelopes',
    processing: '2-3 business days',
    freeShipping: false,
    stock: 90,
    sales: 520,
    tags: ['greeting cards', 'letterpress', 'stationery', 'thank you']
  },
  {
    id: 'minimal-label-note-cards',
    name: 'Minimal Label Note Cards',
    price: 180,
    sellerId: 'paper-trail',
    categoryId: 'paper',
    rating: 4.5,
    reviews: 48,
    description:
      'Ten plain note cards with a single label line — for gift tags, lunchbox notes, and desk reminders.',
    photo: 'photo-1548846081-783981a9cdd2',
    badge: 'new',
    materials: 'Uncoated 250gsm card, soy ink',
    processing: '1-2 business days',
    freeShipping: false,
    stock: 130,
    sales: 305,
    tags: ['note cards', 'labels', 'minimal', 'budget']
  },
  {
    id: 'pastel-desk-stationery-set',
    name: 'Pastel Desk Stationery Set',
    price: 560,
    sellerId: 'paper-trail',
    categoryId: 'paper',
    rating: 4.7,
    reviews: 77,
    description:
      'Notebook, pens, clips, and sticky tabs in matching mint and blue — a whole desk reset in one flat box.',
    photo: 'photo-1764818958942-f104ba6f8358',
    badge: null,
    materials: 'Recycled paper, gel pens, steel clips',
    processing: '1-2 business days',
    freeShipping: true,
    stock: 60,
    sales: 385,
    tags: ['stationery set', 'desk', 'pastel', 'study']
  },

  /* ---- Bags & Jewelry ---- */
  {
    id: 'classic-structure-handbag',
    name: 'Classic Structure Handbag',
    price: 1450,
    sellerId: 'manila-carry',
    categoryId: 'accessories',
    rating: 4.7,
    reviews: 69,
    description:
      'A structured top-handle bag with a magnetic flap and an adjustable strap for the days you want it on your shoulder.',
    photo: 'photo-1584917865442-de89df76afd3',
    badge: null,
    materials: 'Vegan leather, gold-tone hardware',
    processing: '1-3 business days',
    freeShipping: true,
    stock: 28,
    sales: 190,
    tags: ['handbag', 'leather', 'work', 'gift']
  },
  {
    id: 'floral-everyday-tote',
    name: 'Floral Everyday Tote',
    price: 985,
    sellerId: 'manila-carry',
    categoryId: 'accessories',
    rating: 4.8,
    reviews: 112,
    description:
      'A roomy printed tote with a zip top and an inside pocket that actually holds a bottle.',
    photo: 'photo-1591561954557-26941169b49e',
    badge: 'bestseller',
    materials: 'Printed canvas, vegan leather trim',
    processing: '1-3 business days',
    freeShipping: true,
    stock: 44,
    sales: 430,
    tags: ['tote', 'floral', 'everyday', 'bag']
  },
  {
    id: 'everyday-canvas-backpack',
    name: 'Everyday Canvas Backpack',
    price: 1250,
    sellerId: 'manila-carry',
    categoryId: 'accessories',
    rating: 4.6,
    reviews: 94,
    description:
      'Weather-ready canvas with a padded laptop sleeve, a hidden back pocket, and straps that do not dig in.',
    photo: 'photo-1553062407-98eeb64c6a62',
    badge: null,
    materials: 'Coated canvas, polyester lining',
    processing: '1-3 business days',
    freeShipping: true,
    stock: 36,
    sales: 370,
    tags: ['backpack', 'laptop', 'commute', 'school']
  },
  {
    id: 'dainty-layered-necklace',
    name: 'Dainty Layered Necklace',
    price: 620,
    sellerId: 'gilded-ph',
    categoryId: 'accessories',
    rating: 4.9,
    reviews: 186,
    description:
      'Two fine chains at different lengths with a single bar pendant — worn together, no tangling.',
    photo: 'photo-1611652022419-a9419f74343d',
    badge: 'bestseller',
    materials: '18k gold plating over stainless steel',
    processing: '1-2 business days',
    freeShipping: true,
    stock: 80,
    sales: 620,
    tags: ['necklace', 'gold', 'dainty', 'layered']
  },
  {
    id: 'everyday-gold-hoop-earrings',
    name: 'Everyday Gold Hoop Earrings',
    price: 480,
    sellerId: 'gilded-ph',
    categoryId: 'accessories',
    rating: 4.8,
    reviews: 142,
    description:
      'Lightweight hoops with a secure latch — the pair you stop taking off, even in the shower.',
    photo: 'photo-1617038220319-276d3cfab638',
    badge: null,
    materials: '18k gold plating over stainless steel',
    processing: '1-2 business days',
    freeShipping: true,
    stock: 120,
    sales: 540,
    tags: ['earrings', 'hoops', 'gold', 'everyday']
  },
  {
    id: 'paperclip-chain-bracelet',
    name: 'Paperclip Chain Bracelet',
    price: 545,
    sellerId: 'gilded-ph',
    categoryId: 'accessories',
    rating: 4.7,
    reviews: 98,
    description:
      'A chunky paperclip chain with an extension ring — wears well alone or stacked with a watch.',
    photo: 'photo-1602173574767-37ac01994b2a',
    badge: 'new',
    materials: '18k gold plating over stainless steel',
    processing: '1-2 business days',
    freeShipping: false,
    stock: 66,
    sales: 250,
    tags: ['bracelet', 'chain', 'gold', 'stack']
  },
  {
    id: 'beaded-statement-earrings',
    name: 'Beaded Statement Earrings',
    price: 430,
    sellerId: 'gilded-ph',
    categoryId: 'accessories',
    rating: 4.7,
    reviews: 84,
    description:
      'Hand-strung glass beads on hypoallergenic hooks — light enough to wear all day, bright enough to be the outfit.',
    photo: 'photo-1756792340190-2039b9a1787d',
    badge: 'new',
    materials: 'Glass beads, gold-plated hooks, nylon thread',
    processing: '1-2 business days',
    freeShipping: false,
    stock: 58,
    sales: 275,
    tags: ['earrings', 'beaded', 'colorful', 'handmade']
  },
  {
    id: 'pocket-canvas-tote',
    name: 'Pocket Canvas Tote',
    price: 560,
    sellerId: 'manila-carry',
    categoryId: 'accessories',
    rating: 4.8,
    reviews: 137,
    description:
      'Heavy cotton canvas with an inside slip pocket and a boxed base so it stands up while you pack it.',
    photo: 'photo-1618150663726-c166f0487fbe',
    badge: null,
    materials: '16oz cotton canvas, cotton webbing handles',
    processing: '1-2 business days',
    freeShipping: true,
    stock: 74,
    sales: 545,
    tags: ['tote', 'canvas', 'everyday', 'market']
  },
  {
    id: 'woven-wall-bag',
    name: 'Handwoven Wall Bag Pair',
    price: 890,
    compareAt: 990,
    sellerId: 'manila-carry',
    categoryId: 'accessories',
    rating: 4.6,
    reviews: 52,
    description:
      'A pair of handwoven bags with patterned straps — worn crossbody, or hung on a wall as a set.',
    photo: 'photo-1776219189008-b80cc6081517',
    badge: 'sale',
    materials: 'Handwoven abaca blend, adjustable webbing strap',
    processing: '3-4 business days',
    freeShipping: true,
    stock: 20,
    sales: 195,
    tags: ['woven', 'crossbody', 'artisan', 'resort']
  },
  {
    id: 'artisan-market-jewelry-set',
    name: 'Artisan Market Jewelry Set',
    price: 820,
    sellerId: 'gilded-ph',
    categoryId: 'accessories',
    rating: 4.8,
    reviews: 59,
    description:
      'A mixed set of handmade earrings, bracelets, and rings picked from our market table. One box, three finishes.',
    photo: 'photo-1762926674339-26d7a7ab5d30',
    badge: 'new',
    materials: 'Brass, glass beads, elastic cord, gift box',
    processing: '3-4 business days',
    freeShipping: true,
    stock: 19,
    sales: 128,
    tags: ['jewelry set', 'handmade', 'market', 'gift']
  },
  {
    id: 'colorful-beaded-bracelet-stack',
    name: 'Colorful Beaded Bracelet Stack',
    price: 480,
    sellerId: 'gilded-ph',
    categoryId: 'accessories',
    rating: 4.7,
    reviews: 66,
    description:
      'A stack of five beaded bracelets on stretch cord, mixed by hand so no two stacks are the same.',
    photo: 'photo-1766560361090-631fc8294b60',
    badge: null,
    materials: 'Glass beads, stretch cord, seed beads',
    processing: '1-2 business days',
    freeShipping: false,
    stock: 47,
    sales: 266,
    tags: ['bracelets', 'beaded', 'stack', 'colorful']
  }
];

/* ================= Seed reviews ================= */

const seedReviews = [
  { productId: 'everlasting-dried-arrangement', author: 'Mariel S.', rating: 5, date: 'Aug 14, 2026', text: 'Arrived tidier than the photo and the grasses did not shed a single bit. It has been on my shelf for two months and still looks fresh.', helpful: 24 },
  { productId: 'everlasting-dried-arrangement', author: 'Joanna P.', rating: 4, date: 'Jul 29, 2026', text: 'Lovely arrangement, slightly smaller than I imagined but the tin is sturdy. Seller answered my questions within an hour.', helpful: 11 },
  { productId: 'fresh-bloom-bouquet', author: 'Kim V.', rating: 5, date: 'Sep 2, 2026', text: 'Ordered at 9am, delivered before lunch. My sister cried. Worth every peso.', helpful: 31 },
  { productId: 'fresh-bloom-bouquet', author: 'Ramon T.', rating: 4, date: 'Aug 6, 2026', text: 'Roses were fresh and the kraft wrap held up in the rain. One stem arrived slightly bent but the shop replaced it.', helpful: 9 },
  { productId: 'mini-rose-bunch', author: 'Aileen R.', rating: 5, date: 'Aug 21, 2026', text: 'Perfect little pick-me-up for my cousin. The handwritten card was a nice touch.', helpful: 7 },
  { productId: 'mini-rose-bunch', author: 'Bea L.', rating: 4, date: 'Jul 18, 2026', text: 'Good value. Roses lasted five days in water.', helpful: 5 },
  { productId: 'sweetheart-hand-bouquet', author: 'Trisha M.', rating: 5, date: 'Sep 8, 2026', text: 'The eucalyptus smell when I opened the box! Photos do not do it justice.', helpful: 42 },
  { productId: 'sweetheart-hand-bouquet', author: 'Noel D.', rating: 5, date: 'Aug 25, 2026', text: 'Proposed with these. She said yes, so five stars.', helpful: 38 },
  { productId: 'market-fresh-wrap', author: 'Grace H.', rating: 4, date: 'Sep 5, 2026', text: 'Whatever was blooming that day turned out to be peonies. Very generous bunch.', helpful: 12 },
  { productId: 'printed-magnetic-photo', author: 'Dianne C.', rating: 5, date: 'Sep 10, 2026', text: 'Proof came in an hour, print arrived three days later. Colours are spot on against the original.', helpful: 56 },
  { productId: 'printed-magnetic-photo', author: 'Patrick L.', rating: 5, date: 'Aug 30, 2026', text: 'Bought ten for the office fridge. Everyone wanted the supplier.', helpful: 27 },
  { productId: 'printed-magnetic-photo', author: 'Yumi K.', rating: 4, date: 'Aug 11, 2026', text: 'Magnet is strong, print is glossy. Wish the square was a touch bigger.', helpful: 14 },
  { productId: 'magnetic-photo-set-of-4', author: 'Carlo B.', rating: 5, date: 'Sep 1, 2026', text: 'Four photos of our dog now run the fridge. Print quality is better than the print shop I used before.', helpful: 19 },
  { productId: 'magnetic-photo-set-of-4', author: 'Ella F.', rating: 4, date: 'Aug 17, 2026', text: 'Nice set, one magnet had a tiny crease at the corner but the shop reprinted it right away.', helpful: 8 },
  { productId: 'polaroid-magnetic-photos', author: 'Sam R.', rating: 5, date: 'Sep 6, 2026', text: 'The white border really does look like real polaroids. Great for dorm rooms.', helpful: 22 },
  { productId: 'polaroid-magnetic-photos', author: 'Lara M.', rating: 4, date: 'Jul 30, 2026', text: 'Matte finish is lovely. Shipping took a day longer than estimated.', helpful: 6 },
  { productId: 'framed-photo-print-set', author: 'Hannah G.', rating: 5, date: 'Sep 12, 2026', text: 'The frames are slimmer than most and look very modern. Gift for our housewarming and the hosts hung it immediately.', helpful: 17 },
  { productId: 'framed-photo-print-set', author: 'Miguel A.', rating: 5, date: 'Aug 22, 2026', text: 'Prints are sharp, glass is clean, nothing rattled. Packaged properly.', helpful: 10 },
  { productId: 'custom-engraved-plate-keychain', author: 'Jomar V.', rating: 5, date: 'Sep 11, 2026', text: 'Engraving is deep and even. Bought three for the whole family.', helpful: 33 },
  { productId: 'custom-engraved-plate-keychain', author: 'Rina S.', rating: 5, date: 'Aug 28, 2026', text: 'Sent a photo of my design, they vectorised it for free. Fast reply too.', helpful: 21 },
  { productId: 'custom-engraved-plate-keychain', author: 'Karlo D.', rating: 4, date: 'Aug 3, 2026', text: 'Solid plate. Carabiner spring is a bit stiff at first but loosens up.', helpful: 9 },
  { productId: 'key-tag-card-holder', author: 'Pat C.', rating: 5, date: 'Sep 3, 2026', text: 'Fits my beep card and a house key without bulging. Very slim.', helpful: 13 },
  { productId: 'key-tag-card-holder', author: 'Nica J.', rating: 4, date: 'Aug 19, 2026', text: 'Material feels nicer than expected. Colour is true to the photos.', helpful: 7 },
  { productId: 'vintage-heart-keychain', author: 'Sofia R.', rating: 5, date: 'Sep 7, 2026', text: 'Gave this to my partner on our anniversary. The embossing is detailed and the brass does not look cheap.', helpful: 26 },
  { productId: 'vintage-heart-keychain', author: 'Andrei P.', rating: 4, date: 'Jul 27, 2026', text: 'Heavier than expected, which I like. Slightly larger than a normal keychain.', helpful: 5 },
  { productId: 'crochet-turtle-plush', author: 'Mara L.', rating: 5, date: 'Sep 9, 2026', text: 'Stitches are so even you would think it was machine made. My toddler sleeps with it.', helpful: 29 },
  { productId: 'crochet-turtle-plush', author: 'Joy T.', rating: 5, date: 'Aug 15, 2026', text: 'Requested a grey colourway and they matched my reference perfectly.', helpful: 12 },
  { productId: 'handwoven-market-tote', author: 'Bianca F.', rating: 5, date: 'Sep 4, 2026', text: 'Held a full week of groceries without stretching. The zip pocket is the best part.', helpful: 18 },
  { productId: 'handwoven-market-tote', author: 'Ernesto Q.', rating: 4, date: 'Aug 8, 2026', text: 'Well woven, handles are comfortable. Smaller than a beach tote but that is what I wanted.', helpful: 6 },
  { productId: 'beaded-stack-bracelets', author: 'Angel M.', rating: 5, date: 'Sep 13, 2026', text: 'Sent my school colours and they matched the swatches exactly. Split them with two friends.', helpful: 20 },
  { productId: 'beaded-stack-bracelets', author: 'Faye B.', rating: 4, date: 'Aug 12, 2026', text: 'Elastic is strong. One set ran slightly loose on my wrist but the shop offered a remake.', helpful: 8 },
  { productId: 'wooden-artist-figurine', author: 'Diego N.', rating: 5, date: 'Aug 26, 2026', text: 'Joints move smoothly and it holds a pose. Smells faintly of linseed, in a good way.', helpful: 11 },
  { productId: 'wooden-artist-figurine', author: 'Celine O.', rating: 5, date: 'Jul 22, 2026', text: 'Lovely desk companion and a great gift for art students.', helpful: 9 },
  { productId: 'shell-wind-chime', author: 'Ma. Teresa L.', rating: 5, date: 'Sep 5, 2026', text: 'Sounds like the beach without being loud. Hangs by our kitchen window.', helpful: 16 },
  { productId: 'shell-wind-chime', author: 'Fritz A.', rating: 4, date: 'Aug 20, 2026', text: 'Shells are clean and evenly spaced. Driftwood is lighter than expected.', helpful: 7 },
  { productId: 'woven-straw-souvenir-hat', author: 'Lara S.', rating: 5, date: 'Aug 31, 2026', text: 'Packable — I folded it into a carry-on and it sprang right back.', helpful: 14 },
  { productId: 'woven-straw-souvenir-hat', author: 'Nico P.', rating: 4, date: 'Jul 25, 2026', text: 'Nice weave, runs slightly large. The chin strap is a thoughtful addition.', helpful: 5 },
  { productId: 'hand-painted-keepsake-vase', author: 'Anne V.', rating: 5, date: 'Sep 2, 2026', text: 'Brush strokes are visible up close and the maker signed the base. Feels personal.', helpful: 12 },
  { productId: 'hand-painted-keepsake-vase', author: 'Rodel M.', rating: 4, date: 'Aug 9, 2026', text: 'Small but heavy enough to be stable. Glaze is glossy and even.', helpful: 6 },
  { productId: 'speckled-ceramic-cup-set', author: 'Isabel R.', rating: 5, date: 'Sep 12, 2026', text: 'The glaze speckles are different on every cup and that is exactly the point. Feels great in the hand.', helpful: 23 },
  { productId: 'speckled-ceramic-cup-set', author: 'Ton P.', rating: 5, date: 'Aug 24, 2026', text: 'Survived my dishwasher. Handles absent by design, which I now prefer.', helpful: 10 },
  { productId: 'amber-glass-soy-candle', author: 'Rhea C.', rating: 5, date: 'Sep 10, 2026', text: 'Fills the room in ten minutes without being sharp. The glass is reusable — I keep pens in mine now.', helpful: 27 },
  { productId: 'amber-glass-soy-candle', author: 'Louise M.', rating: 4, date: 'Aug 16, 2026', text: 'Warm scent, clean burn. Wick trimmed a little on the first light to avoid tunneling.', helpful: 9 },
  { productId: 'stoneware-bud-vase-set', author: 'Gabby T.', rating: 5, date: 'Sep 8, 2026', text: 'Three heights look perfect on our console. Matte finish hides dust.', helpful: 13 },
  { productId: 'stoneware-bud-vase-set', author: 'Miko S.', rating: 4, date: 'Aug 5, 2026', text: 'One vase had a small glaze pop, shop offered a discount and it is invisible in daily use.', helpful: 6 },
  { productId: 'personalized-notes-journal', author: 'Karen D.', rating: 5, date: 'Sep 14, 2026', text: 'Foiled my full name and it is crisp. My fountain pen does not ghost through the pages.', helpful: 30 },
  { productId: 'personalized-notes-journal', author: 'Josh R.', rating: 5, date: 'Aug 27, 2026', text: 'Lay-flat binding actually lays flat. Bought a second one as a giveaway.', helpful: 15 },
  { productId: 'spiral-notebook-duo', author: 'Trina L.', rating: 4, date: 'Sep 1, 2026', text: 'Covers are stiff enough to write on your lap. Wire did not bend in my bag.', helpful: 11 },
  { productId: 'spiral-notebook-duo', author: 'Migs A.', rating: 5, date: 'Aug 13, 2026', text: 'Dot grid spacing is a clean 5mm. Perfect for class notes and sketches.', helpful: 8 },
  { productId: 'weekly-goals-planner', author: 'Sam O.', rating: 5, date: 'Sep 13, 2026', text: 'Undated means I can start in October without wasting half the book. The three-priority layout keeps me honest.', helpful: 34 },
  { productId: 'weekly-goals-planner', author: 'Grace W.', rating: 5, date: 'Aug 29, 2026', text: 'Paper takes gel pen without smudging. Ribbon marker is a nice detail.', helpful: 17 },
  { productId: 'kraft-gift-wrap-set', author: 'Joyce N.', rating: 5, date: 'Sep 6, 2026', text: 'Ribbon is proper satin, not the scratchy kind. Sheets are big enough for a shoebox.', helpful: 14 },
  { productId: 'kraft-gift-wrap-set', author: 'Arman E.', rating: 4, date: 'Aug 18, 2026', text: 'Good kit, would love a tape dispenser included. Everything else was great.', helpful: 6 },
  { productId: 'ready-to-gift-box', author: 'Lia F.', rating: 5, date: 'Sep 9, 2026', text: 'Ribbon came pre-tied and perfect. Saved me twenty minutes at midnight.', helpful: 19 },
  { productId: 'ready-to-gift-box', author: 'Paolo G.', rating: 4, date: 'Aug 21, 2026', text: 'Rigid boxes, no crushed corners. Slightly smaller than a shoebox.', helpful: 7 },
  { productId: 'linen-reading-journal', author: 'Bianca U.', rating: 5, date: 'Sep 11, 2026', text: 'The quote pages at the back are my favourite part. Linen cover feels premium.', helpful: 16 },
  { productId: 'linen-reading-journal', author: 'Theo K.', rating: 4, date: 'Aug 7, 2026', text: 'Wish it held more than 100 books, but the layout is clean.', helpful: 5 },
  { productId: 'classic-structure-handbag', author: 'Divine S.', rating: 5, date: 'Sep 7, 2026', text: 'Holds a 13-inch laptop, a bottle, and a lunch container without sagging. Hardware is gold, not brassy.', helpful: 21 },
  { productId: 'classic-structure-handbag', author: 'Mandy R.', rating: 4, date: 'Aug 14, 2026', text: 'Structured and chic. The strap is a little long at its shortest.', helpful: 9 },
  { productId: 'floral-everyday-tote', author: 'Cathy B.', rating: 5, date: 'Sep 14, 2026', text: 'Print is not overwhelming and the zip top means nothing falls out on the bus.', helpful: 24 },
  { productId: 'floral-everyday-tote', author: 'Ria M.', rating: 5, date: 'Aug 23, 2026', text: 'Bought for my sister, kept it for myself. Very roomy.', helpful: 12 },
  { productId: 'everyday-canvas-backpack', author: 'Enzo L.', rating: 5, date: 'Sep 3, 2026', text: 'Survived a week of rain commutes. Laptop stayed dry and the straps did not dig in.', helpful: 18 },
  { productId: 'everyday-canvas-backpack', author: 'Faye T.', rating: 4, date: 'Aug 10, 2026', text: 'Back pocket is perfect for a wallet. Would love more colour options.', helpful: 7 },
  { productId: 'dainty-layered-necklace', author: 'Yna C.', rating: 5, date: 'Sep 15, 2026', text: 'No tangling after two weeks of daily wear. Clasp is easy to do one-handed.', helpful: 28 },
  { productId: 'dainty-layered-necklace', author: 'Bea Santos', rating: 5, date: 'Aug 30, 2026', text: 'Gift for my best friend and she has not taken it off. Pouch it comes in is reusable.', helpful: 13 },
  { productId: 'everyday-gold-hoop-earrings', author: 'Mica R.', rating: 5, date: 'Sep 12, 2026', text: 'Light enough to sleep in and the latch has not loosened.', helpful: 20 },
  { productId: 'everyday-gold-hoop-earrings', author: 'Dianne O.', rating: 4, date: 'Aug 19, 2026', text: 'Slightly bigger than the 20mm I expected, but I like the statement.', helpful: 8 },
  { productId: 'paperclip-chain-bracelet', author: 'Kim P.', rating: 5, date: 'Sep 15, 2026', text: 'Chunky without being heavy. Extension ring means it fits over a watch.', helpful: 15 },
  { productId: 'paperclip-chain-bracelet', author: 'Alexis V.', rating: 4, date: 'Aug 26, 2026', text: 'Clasp is secure. Colour has not turned after daily wear and handwashing.', helpful: 9 },
  { productId: 'sunflower-day-bouquet', author: 'Rowena T.', rating: 5, date: 'Sep 13, 2026', text: 'Stems were thick and the heads did not droop once. Lasted nine days in a jar on our table.', helpful: 17 },
  { productId: 'sunflower-day-bouquet', author: 'Jerome A.', rating: 4, date: 'Aug 28, 2026', text: 'Great value for the size. Would love an option with more greenery mixed in.', helpful: 6 },
  { productId: 'blush-peony-bouquet', author: 'Katrina L.', rating: 5, date: 'Sep 16, 2026', text: 'Arrived half-open and bloomed over three days exactly like the care card said. Stunning.', helpful: 26 },
  { productId: 'blush-peony-bouquet', author: 'Migs D.', rating: 5, date: 'Aug 24, 2026', text: 'Ordered for our anniversary. The silk ribbon is a nice upgrade over plain twine.', helpful: 11 },
  { productId: 'wrapped-spring-tulips', author: 'Aya M.', rating: 5, date: 'Sep 10, 2026', text: 'Twenty fat stems wrapped so neatly I did not want to unwrap them. Good everyday gift.', helpful: 9 },
  { productId: 'wrapped-spring-tulips', author: 'Paolo R.', rating: 4, date: 'Aug 15, 2026', text: 'Tulips leaned toward the window within a day, which is normal. No complaints about freshness.', helpful: 4 },
  { productId: 'layflat-photo-book', author: 'Camille V.', rating: 5, date: 'Sep 17, 2026', text: 'Opened it flat and the spread read as one photo. Paper weight feels far above the price.', helpful: 34 },
  { productId: 'layflat-photo-book', author: 'Nathan O.', rating: 5, date: 'Sep 2, 2026', text: 'Sent ninety photos of our trip and every page came back colour-checked. Turnaround was four days.', helpful: 21 },
  { productId: 'linen-memory-album', author: 'Bernice C.', rating: 5, date: 'Sep 8, 2026', text: 'Heavy in the best way. The glassine sheets mean old prints are not sticking together years later.', helpful: 15 },
  { productId: 'linen-memory-album', author: 'Ivan S.', rating: 4, date: 'Aug 20, 2026', text: 'Beautiful album, though the self-adhesive pages take practice to line up straight.', helpful: 7 },
  { productId: 'retro-instant-print-pack', author: 'Trina B.', rating: 5, date: 'Sep 14, 2026', text: 'The white border really sells the look. Pinned all twelve above my desk.', helpful: 19 },
  { productId: 'retro-instant-print-pack', author: 'Carlo P.', rating: 4, date: 'Aug 29, 2026', text: 'Prints are sharp and the envelope kept them flat. One corner got a small crease in transit.', helpful: 6 },
  { productId: 'couple-initial-keychain', author: 'Sam G.', rating: 5, date: 'Sep 15, 2026', text: 'Stamping is deep and clean, not printed on the surface. Still crisp after two months of keys.', helpful: 23 },
  { productId: 'couple-initial-keychain', author: 'Dianne F.', rating: 5, date: 'Sep 1, 2026', text: 'Bought as a graduation gift for siblings. They immediately put them on their bags.', helpful: 10 },
  { productId: 'housewarming-door-keyring', author: 'Marlon E.', rating: 4, date: 'Sep 6, 2026', text: 'Engraving is small but legible. Lighter than I expected, which is a plus on a door.', helpful: 8 },
  { productId: 'housewarming-door-keyring', author: 'Joy A.', rating: 5, date: 'Aug 18, 2026', text: 'Gave this at a housewarming and it was the present everyone asked about.', helpful: 12 },
  { productId: 'anime-charm-keychain', author: 'Renz K.', rating: 5, date: 'Sep 12, 2026', text: 'Colours are vivid on both sides and the matte finish does not scratch easily. Clasp is solid.', helpful: 27 },
  { productId: 'anime-charm-keychain', author: 'Mara L.', rating: 4, date: 'Aug 22, 2026', text: 'Slightly bigger than I pictured, but it hangs fine on a backpack loop.', helpful: 9 },
  { productId: 'crochet-bear-plush', author: 'Hazel N.', rating: 5, date: 'Sep 16, 2026', text: 'Stitching is even all round and there are no loose ends. Safe for my toddler, which was the point.', helpful: 31 },
  { productId: 'crochet-bear-plush', author: 'Denise P.', rating: 5, date: 'Aug 27, 2026', text: 'It came wrapped in tissue with a hand-written tag. You can feel the hours in it.', helpful: 14 },
  { productId: 'crochet-bunny-plush', author: 'Angela R.', rating: 5, date: 'Sep 9, 2026', text: 'Ears are floppy in the right way and the yarn is softer than expected. Matches the bear perfectly.', helpful: 16 },
  { productId: 'crochet-bunny-plush', author: 'Toti M.', rating: 4, date: 'Aug 12, 2026', text: 'Lovely toy, took a little longer to ship than stated because it is made to order.', helpful: 5 },
  { productId: 'crochet-ornament-garland', author: 'Pia S.', rating: 5, date: 'Sep 11, 2026', text: 'Hung it across the nursery shelf in seconds. The cord is long enough to loop twice.', helpful: 13 },
  { productId: 'crochet-ornament-garland', author: 'Bogs T.', rating: 4, date: 'Aug 25, 2026', text: 'Colours are a touch brighter than the photos but they look great against white walls.', helpful: 6 },
  { productId: 'starfish-shell-frame', author: 'Lara J.', rating: 5, date: 'Sep 17, 2026', text: 'Nothing shifted in the box and the glass was spotless. Looks far more expensive than it cost.', helpful: 25 },
  { productId: 'starfish-shell-frame', author: 'Emil V.', rating: 4, date: 'Sep 3, 2026', text: 'Arrives fully assembled and ready to hang. I would have liked a small stand option too.', helpful: 8 },
  { productId: 'seashell-glass-vase', author: 'Nica D.', rating: 5, date: 'Sep 5, 2026', text: 'Sits on my work desk and gets a comment every week. The glass base is heavier than it looks.', helpful: 11 },
  { productId: 'seashell-glass-vase', author: 'Franco B.', rating: 4, date: 'Aug 19, 2026', text: 'Natural shell so mine differs slightly from the photo. That is exactly what I wanted.', helpful: 7 },
  { productId: 'assorted-shell-craft-set', author: 'Mae L.', rating: 5, date: 'Sep 13, 2026', text: 'Used these with my class for a collage unit. Clean, sorted, and no sand in the bag.', helpful: 18 },
  { productId: 'assorted-shell-craft-set', author: 'Gelo R.', rating: 4, date: 'Aug 21, 2026', text: 'Good variety of sizes. A few smaller ones were chipped but nothing unusable.', helpful: 5 },
  { productId: 'matte-black-candle-holder', author: 'Vina C.', rating: 5, date: 'Sep 16, 2026', text: 'The glaze is genuinely matte, no shine at all. Heavy enough that it does not wobble.', helpful: 20 },
  { productId: 'matte-black-candle-holder', author: 'Arnel Q.', rating: 5, date: 'Sep 4, 2026', text: 'Bought two for the dinner table. Fits standard tapers snugly with no drips on the base.', helpful: 9 },
  { productId: 'round-woven-storage-basket', author: 'Cess M.', rating: 5, date: 'Sep 14, 2026', text: 'Holds two throw blankets and still keeps its shape. The lining is a nice touch.', helpful: 17 },
  { productId: 'round-woven-storage-basket', author: 'Ben T.', rating: 4, date: 'Aug 26, 2026', text: 'Sturdy weave and it stands empty. Measure your shelf first, it is wider than it looks.', helpful: 8 },
  { productId: 'soy-candle-in-ceramic-dish', author: 'Marga L.', rating: 5, date: 'Sep 15, 2026', text: 'Burns clean with no soot on the glass and the scent fills the room without shouting.', helpful: 29 },
  { productId: 'soy-candle-in-ceramic-dish', author: 'Ken A.', rating: 4, date: 'Sep 1, 2026', text: 'Ceramic dish is reusable and I have since planted a succulent in it. Wick burned evenly.', helpful: 12 },
  { productId: 'letterpress-card-bundle', author: 'Ida F.', rating: 5, date: 'Sep 17, 2026', text: 'The impression is deep enough to feel with a fingertip. Envelopes are proper kraft, not thin paper.', helpful: 22 },
  { productId: 'letterpress-card-bundle', author: 'Ruben S.', rating: 5, date: 'Sep 6, 2026', text: 'Bought a second bundle after the first ran out. Blank inside, which is exactly what I needed.', helpful: 10 },
  { productId: 'minimal-label-note-cards', author: 'Sari P.', rating: 4, date: 'Sep 10, 2026', text: 'Thin enough to tuck into a lunchbox, sturdy enough that gel pen does not bleed through.', helpful: 9 },
  { productId: 'minimal-label-note-cards', author: 'Lou M.', rating: 5, date: 'Aug 23, 2026', text: 'Perfect price point for a small add-on gift. The single label line is very clean.', helpful: 6 },
  { productId: 'pastel-desk-stationery-set', author: 'Grace U.', rating: 5, date: 'Sep 16, 2026', text: 'Everything matched the photos and the box itself doubled as a desk tray.', helpful: 19 },
  { productId: 'pastel-desk-stationery-set', author: 'Danilo E.', rating: 4, date: 'Aug 30, 2026', text: 'Great starter set. The pens are finer than I expected, in a good way.', helpful: 7 },
  { productId: 'beaded-statement-earrings', author: 'Bianca R.', rating: 5, date: 'Sep 17, 2026', text: 'Beads are glass, not plastic, and they catch light beautifully. Hooks did not irritate my ears.', helpful: 24 },
  { productId: 'beaded-statement-earrings', author: 'Thea S.', rating: 4, date: 'Sep 2, 2026', text: 'Bigger than I pictured but that is the point of a statement pair. Very light though.', helpful: 8 },
  { productId: 'pocket-canvas-tote', author: 'Mila G.', rating: 5, date: 'Sep 15, 2026', text: 'The boxed base means it stands open while I load groceries in. Handles have not frayed.', helpful: 26 },
  { productId: 'pocket-canvas-tote', author: 'Jomar D.', rating: 5, date: 'Aug 28, 2026', text: 'Thick canvas with no chemical smell. Washed it once and it held its shape.', helpful: 11 },
  { productId: 'woven-wall-bag', author: 'Rhea T.', rating: 5, date: 'Sep 14, 2026', text: 'Weaving is tight and the straps are adjustable. Wore it crossbody for a whole weekend.', helpful: 18 },
  { productId: 'woven-wall-bag', author: 'Odette L.', rating: 4, date: 'Aug 25, 2026', text: 'Beautiful pair, though the smaller bag fits only a phone and a card. Straps are lovely.', helpful: 7 },
  { productId: 'grand-yellow-rose-bouquet', author: 'Cristina A.', rating: 5, date: 'Sep 15, 2026', text: 'Huge and heavy when it arrived. The yellow was so bright it lit up the whole room.', helpful: 34 },
  { productId: 'grand-yellow-rose-bouquet', author: 'Paolo M.', rating: 5, date: 'Aug 30, 2026', text: 'Bought this for my sisters graduation and everyone asked where it came from.', helpful: 19 },
  { productId: 'statement-rose-arrangement', author: 'Denise R.', rating: 5, date: 'Sep 1, 2026', text: 'The ceramic vase alone is worth half the price. Roses opened perfectly on day three.', helpful: 22 },
  { productId: 'statement-rose-arrangement', author: 'Arnel V.', rating: 4, date: 'Jul 24, 2026', text: 'Beautiful arrangement but the box was a bit tall for the courier. Arrived fine after all.', helpful: 8 },
  { productId: 'garden-spill-arrangement', author: 'Ma. Teresa L.', rating: 5, date: 'Sep 9, 2026', text: 'Looks like something from a magazine. Guests kept touching it to check if the flowers were real.', helpful: 26 },
  { productId: 'garden-spill-arrangement', author: 'Jonas P.', rating: 5, date: 'Aug 18, 2026', text: 'Arranged exactly like the photo and the low bowl is reusable.', helpful: 14 },
  { productId: 'grand-mixed-bloom-vase', author: 'Sheryl B.', rating: 5, date: 'Sep 6, 2026', text: 'Very generous for the price. The lilies were still in bud so they lasted almost two weeks.', helpful: 31 },
  { productId: 'grand-mixed-bloom-vase', author: 'Rico D.', rating: 4, date: 'Aug 11, 2026', text: 'Good value. One chrysanthemum was crushed in transit but they replaced it the next day.', helpful: 11 },
  { productId: 'roses-in-a-box-gift', author: 'Angelica F.', rating: 5, date: 'Sep 18, 2026', text: 'The box arrived cold packed and every single rose was perfect. Presentation was flawless.', helpful: 45 },
  { productId: 'roses-in-a-box-gift', author: 'Marco S.', rating: 5, date: 'Aug 27, 2026', text: 'My wife assumed it was from a boutique hotel. Keep doing what you are doing.', helpful: 38 },
  { productId: 'petite-dried-posy', author: 'Lara C.', rating: 5, date: 'Jul 30, 2026', text: 'Tiny and perfect for my shelf. It has sat there for a month and nothing has fallen off.', helpful: 16 },
  { productId: 'petite-dried-posy', author: 'Nestor G.', rating: 4, date: 'Jun 29, 2026', text: 'Smaller than I pictured but the quality of the dried stems is good.', helpful: 6 },
  { productId: 'desk-posy-in-glass', author: 'Vina H.', rating: 5, date: 'Sep 12, 2026', text: 'Sent this to my tita in the hospital. The small vase made it so much easier to keep.', helpful: 21 },
  { productId: 'desk-posy-in-glass', author: 'Edgar T.', rating: 5, date: 'Aug 22, 2026', text: 'Roses were fresh and the water pack meant I did not have to unwrap anything.', helpful: 13 },
  { productId: 'petite-pink-rose-jar', author: 'Grace N.', rating: 4, date: 'Aug 3, 2026', text: 'Lovely little jar. Lasted five days on my desk with fresh water.', helpful: 9 },
  { productId: 'petite-pink-rose-jar', author: 'Kimmy O.', rating: 5, date: 'Jul 14, 2026', text: 'Great as a party favour. Ordered ten and every one looked identical.', helpful: 17 },
  { productId: 'single-stem-rose-vase', author: 'Patricia Y.', rating: 5, date: 'Sep 20, 2026', text: 'My go-to small gift now. Classy without being expensive.', helpful: 28 },
  { productId: 'single-stem-rose-vase', author: 'Bong R.', rating: 5, date: 'Aug 8, 2026', text: 'Ordered three for my team and they all lasted the full week.', helpful: 15 },
  { productId: 'little-white-purple-bunch', author: 'Trina M.', rating: 5, date: 'Jul 21, 2026', text: 'The tissue wrapping was so pretty I did not want to open it.', helpful: 12 },
  { productId: 'little-white-purple-bunch', author: 'Owen K.', rating: 4, date: 'Jun 17, 2026', text: 'Good bunch for the money, though the lilac stems were shorter than expected.', helpful: 7 },
  { productId: 'pink-wrapped-18th-birthday-bouquet', author: 'Bea C.', rating: 5, date: 'Sep 14, 2026', text: 'My daughters debut photos were made by this bouquet. The number eighteen tag was the sweetest detail.', helpful: 41 },
  { productId: 'pink-wrapped-18th-birthday-bouquet', author: 'Rowena P.', rating: 5, date: 'Aug 29, 2026', text: 'Wrapped so neatly it needed no ribbon. Photos do not show how big it actually is.', helpful: 24 },
  { productId: 'brights-18th-birthday-bouquet', author: 'Jomar L.', rating: 5, date: 'Sep 5, 2026', text: 'Colourful without looking cheap. My niece carried it all night and nothing fell apart.', helpful: 18 },
  { productId: 'brights-18th-birthday-bouquet', author: 'Sari V.', rating: 4, date: 'Jul 27, 2026', text: 'Pretty flowers, though I would have liked a longer stem length.', helpful: 8 },
  { productId: 'purple-pop-18th-birthday-bouquet', author: 'Dianne A.', rating: 5, date: 'Sep 11, 2026', text: 'The purple foil wrap made it feel like a party on its own.', helpful: 20 },
  { productId: 'purple-pop-18th-birthday-bouquet', author: 'Herbert N.', rating: 5, date: 'Aug 15, 2026', text: 'Fresh, full, and delivered on time. Very happy with this one.', helpful: 12 },
  { productId: 'pink-yellow-18th-birthday-bouquet', author: 'Cheska R.', rating: 4, date: 'Aug 5, 2026', text: 'Cheerful colours and good value. Held up well through a whole day of photos.', helpful: 11 },
  { productId: 'pink-yellow-18th-birthday-bouquet', author: 'Lito S.', rating: 5, date: 'Jul 8, 2026', text: 'Picked this up at noon and the roses were still cool. Nice packing.', helpful: 9 },
  { productId: 'red-white-18th-birthday-bouquet', author: 'Mariel D.', rating: 5, date: 'Sep 16, 2026', text: 'Formal and elegant, exactly right for a debut entrance.', helpful: 25 },
  { productId: 'red-white-18th-birthday-bouquet', author: 'Karen B.', rating: 5, date: 'Aug 24, 2026', text: 'The wax flower added such a nice texture. Box arrived without a scratch.', helpful: 16 },
  { productId: 'celebration-18th-birthday-bouquet', author: 'Jenny Q.', rating: 5, date: 'Sep 3, 2026', text: 'Statement bouquet. Three people at the party asked for the shop name.', helpful: 33 },
  { productId: 'celebration-18th-birthday-bouquet', author: 'Anton W.', rating: 5, date: 'Jul 31, 2026', text: 'Lilies were still closed so they opened over the weekend. Great longevity.', helpful: 21 },
  { productId: 'everlast-anniversary-roses', author: 'Lorna G.', rating: 5, date: 'Sep 7, 2026', text: 'The handwritten card is what made it. Roses stayed fresh for nine days.', helpful: 19 },
  { productId: 'everlast-anniversary-roses', author: 'Felix M.', rating: 4, date: 'Aug 19, 2026', text: 'Ceramic vase is solid. Colour mix is softer than the photo but still lovely.', helpful: 9 },
  { productId: 'blush-roses-anniversary-vase', author: 'Corinne T.', rating: 5, date: 'Sep 10, 2026', text: 'Low and full. Sat in the middle of our anniversary dinner table all night.', helpful: 23 },
  { productId: 'blush-roses-anniversary-vase', author: 'Danilo P.', rating: 5, date: 'Aug 2, 2026', text: 'Arranged beautifully and the glass cube is heavy quality.', helpful: 14 },
  { productId: 'classic-red-anniversary-roses', author: 'Susan E.', rating: 5, date: 'Sep 19, 2026', text: 'Twenty years married and these still beat any florist down the road.', helpful: 47 },
  { productId: 'classic-red-anniversary-roses', author: 'Roy C.', rating: 5, date: 'Aug 12, 2026', text: 'Long stems, no bruises, and the sleeve kept everything upright.', helpful: 29 },
  { productId: 'rose-basket-anniversary', author: 'Pilar F.', rating: 4, date: 'Jul 26, 2026', text: 'The basket is a keeper. Needed more water on day two but the roses recovered.', helpful: 12 },
  { productId: 'rose-basket-anniversary', author: 'Gerry A.', rating: 5, date: 'Jun 30, 2026', text: 'Substantial piece. Looked far more expensive than what I paid.', helpful: 18 },
  { productId: 'golden-years-anniversary-bouquet', author: 'Tessa L.', rating: 5, date: 'Sep 13, 2026', text: 'Warm tones that photograph beautifully. The jute wrap was a lovely touch.', helpful: 22 },
  { productId: 'golden-years-anniversary-bouquet', author: 'Bong B.', rating: 4, date: 'Aug 6, 2026', text: 'Good mix of blooms, slightly smaller than the listing photo suggested.', helpful: 10 },
  { productId: 'violet-anniversary-bouquet', author: 'Amihan K.', rating: 5, date: 'Jul 19, 2026', text: 'The stock smells amazing. Filled the whole room by the evening.', helpful: 17 },
  { productId: 'violet-anniversary-bouquet', author: 'Noli R.', rating: 4, date: 'Jun 22, 2026', text: 'Nice purple tones, though two petals bruised during delivery.', helpful: 7 },
  { productId: 'photo-ref-magnets-set-of-6', author: 'Mia T.', rating: 5, date: 'Sep 17, 2026', text: 'Magnets are strong enough to hold my kids whole drawing pile. Print quality is sharp.', helpful: 39 },
  { productId: 'photo-ref-magnets-set-of-6', author: 'Carlo S.', rating: 5, date: 'Aug 25, 2026', text: 'Sent these as a Christmas gift and everyone wanted a set for themselves.', helpful: 26 },
  { productId: 'polaroid-ref-magnet-set', author: 'Joyce N.', rating: 5, date: 'Sep 4, 2026', text: 'The white border makes such a difference. My fridge finally looks tidy.', helpful: 21 },
  { productId: 'polaroid-ref-magnet-set', author: 'Emil G.', rating: 5, date: 'Jul 22, 2026', text: 'Eight photos for a low price and the matte finish does not show fingerprints.', helpful: 15 },
  { productId: 'table-calendar-2027', author: 'Aileen M.', rating: 5, date: 'Sep 8, 2026', text: 'Paper is thick and the print is crisp. My mum cried when she saw the grandkids each month.', helpful: 44 },
  { productId: 'table-calendar-2027', author: 'Dexter P.', rating: 5, date: 'Aug 16, 2026', text: 'Wire stand is sturdy and it sits flat on my desk without wobbling.', helpful: 20 },
  { productId: 'spiral-desk-calendar', author: 'Nica R.', rating: 5, date: 'Sep 2, 2026', text: 'Great value with the discount. The fold-out stand is much stronger than I expected.', helpful: 24 },
  { productId: 'spiral-desk-calendar', author: 'Victor L.', rating: 4, date: 'Jul 15, 2026', text: 'Nice print. The spiral could be a little thicker but it works fine.', helpful: 11 },
  { productId: 'wood-stand-photo-calendar', author: 'Rosalie C.', rating: 5, date: 'Aug 28, 2026', text: 'The wooden base makes it feel like a proper gift rather than a printed sheet.', helpful: 27 },
  { productId: 'wood-stand-photo-calendar', author: 'Jun P.', rating: 4, date: 'Jul 6, 2026', text: 'Lovely item. Took six days to arrive which was a bit longer than stated.', helpful: 12 },
  { productId: 'minimal-desk-calendar', author: 'Tanya V.', rating: 5, date: 'Sep 14, 2026', text: 'Clean layout that does not clash with my monitor setup. Photo slot is a nice size.', helpful: 16 },
  { productId: 'minimal-desk-calendar', author: 'Kiko A.', rating: 5, date: 'Aug 1, 2026', text: 'Bought two for the office and my colleagues asked where to order.', helpful: 19 },
  { productId: 'monochrome-wall-desk-calendar', author: 'Beatriz H.', rating: 4, date: 'Jul 28, 2026', text: 'Simple and understated. The hanging loop is a useful extra.', helpful: 10 },
  { productId: 'monochrome-wall-desk-calendar', author: 'Sam O.', rating: 5, date: 'Jun 25, 2026', text: 'Matte finish looks premium. Printed exactly to the file I sent.', helpful: 14 },
  { productId: 'twelve-month-photo-calendar', author: 'Louise D.', rating: 5, date: 'Sep 16, 2026', text: 'They fixed my photo dates without me asking. Holiday labels were already correct.', helpful: 31 },
  { productId: 'twelve-month-photo-calendar', author: 'Arnel B.', rating: 5, date: 'Aug 20, 2026', text: 'Twelve good months of photos and the binding held up when I flipped through twice.', helpful: 18 },
  { productId: 'minimalist-metal-keyring', author: 'Grace I.', rating: 5, date: 'Sep 6, 2026', text: 'Heavy in a good way. The stamping on my initials was clean and even.', helpful: 22 },
  { productId: 'minimalist-metal-keyring', author: 'Teddy M.', rating: 4, date: 'Jul 11, 2026', text: 'Solid keyring, though it took a few days longer than the stated processing time.', helpful: 9 },
  { productId: 'crochet-animal-pair', author: 'Hazel W.', rating: 5, date: 'Sep 12, 2026', text: 'Stitching is so even you would think it was machine made. Adorable together.', helpful: 35 },
  { productId: 'crochet-animal-pair', author: 'Nestor C.', rating: 5, date: 'Aug 9, 2026', text: 'Cotton feels soft and the fill is firm. They hold their shape well.', helpful: 20 },
  { productId: 'crochet-brown-bear-cub', author: 'Pauline R.', rating: 5, date: 'Sep 1, 2026', text: 'Small enough to fit in a pocket and my toddler loves it.', helpful: 23 },
  { productId: 'crochet-brown-bear-cub', author: 'Sonny V.', rating: 5, date: 'Jul 20, 2026', text: 'Eyes are embroidered not plastic which was exactly what I needed for a baby gift.', helpful: 17 },
  { productId: 'crochet-pink-bunny', author: 'Mariel S.', rating: 5, date: 'Sep 5, 2026', text: 'The blanket stitch detail is lovely and the ears flop just right.', helpful: 26 },
  { productId: 'crochet-pink-bunny', author: 'Cathy L.', rating: 4, date: 'Aug 4, 2026', text: 'Very sweet bunny, arrived a shade lighter than the listing photo.', helpful: 11 },
  { productId: 'keepsake-conch-display', author: 'Perry T.', rating: 5, date: 'Sep 9, 2026', text: 'Sealed properly with no smell. The acrylic stand is almost invisible so the shell floats.', helpful: 19 },
  { productId: 'keepsake-conch-display', author: 'Irene F.', rating: 4, date: 'Jul 25, 2026', text: 'Nice piece, slightly smaller than I imagined but well finished.', helpful: 8 },
  { productId: 'trio-soy-candle-set', author: 'Lizelle A.', rating: 5, date: 'Sep 18, 2026', text: 'The calamansi scent is my favourite. Clean burn with no soot on the jar.', helpful: 37 },
  { productId: 'trio-soy-candle-set', author: 'Dodong P.', rating: 5, date: 'Aug 13, 2026', text: 'Forty hours each is honest. Coconut burned the full weekend on my desk.', helpful: 22 },
  { productId: 'woven-market-basket', author: 'Amor G.', rating: 5, date: 'Sep 3, 2026', text: 'Holds a full week of vegetables and the rolled handles do not dig in.', helpful: 25 },
  { productId: 'woven-market-basket', author: 'Ben C.', rating: 4, date: 'Jul 17, 2026', text: 'Sturdy weave, though mine had a loose strand at the rim that I trimmed off.', helpful: 10 },
  { productId: 'junk-journal-starter-kit', author: 'Faye M.', rating: 5, date: 'Sep 15, 2026', text: 'Enough ephemera to start three journals. The handmade book itself is beautiful.', helpful: 42 },
  { productId: 'junk-journal-starter-kit', author: 'Dante R.', rating: 5, date: 'Aug 7, 2026', text: 'Papers are good weight and the washi selection was generous.', helpful: 28 },
  { productId: 'minimal-desk-writing-set', author: 'Cathy B.', rating: 5, date: 'Sep 7, 2026', text: 'Notebook lies reasonably flat and the pen does not smudge. Simple and useful.', helpful: 21 },
  { productId: 'minimal-desk-writing-set', author: 'Noli S.', rating: 4, date: 'Jul 2, 2026', text: 'Good set for the price, the paper is slightly thin for fountain pens.', helpful: 9 },
  { productId: 'layflat-keepsake-journal', author: 'Ines V.', rating: 5, date: 'Sep 11, 2026', text: 'It really does open completely flat. Pasted six photos without the pages fighting back.', helpful: 29 },
  { productId: 'layflat-keepsake-journal', author: 'Alfredo K.', rating: 5, date: 'Aug 17, 2026', text: 'Linen cover feels premium and the binding is holding after heavy use.', helpful: 16 },
  { productId: 'artisan-market-jewelry-set', author: 'Rica P.', rating: 5, date: 'Sep 14, 2026', text: 'Three pieces for one price and each looks like it came from a different maker. Very good.', helpful: 24 },
  { productId: 'artisan-market-jewelry-set', author: 'Nestor A.', rating: 4, date: 'Aug 23, 2026', text: 'Nice variety, the ring ran slightly large for me.', helpful: 11 },
  { productId: 'colorful-beaded-bracelet-stack', author: 'Joy A.', rating: 5, date: 'Sep 10, 2026', text: 'Stack looks cheerful with everything. Stretch cord is tight and secure.', helpful: 27 },
  { productId: 'colorful-beaded-bracelet-stack', author: 'Malou T.', rating: 5, date: 'Jul 29, 2026', text: 'Bought two stacks and no two were the same, exactly as described.', helpful: 15 }
];

/* ================= Coupons ================= */

const coupons = [
  { code: 'WELCOME10', type: 'percent', value: 10, min: 0, label: '10% off your first order' },
  { code: 'STALL50', type: 'fixed', value: 50, min: 500, label: '₱50 off orders over ₱500' },
  { code: 'FREESHIP', type: 'shipping', value: 0, min: 0, label: 'Free delivery on any order' }
];

/* ================= Gift occasions ================= */
/* Each occasion maps to a search the catalogue already understands,
   so the strip stays in sync with the real listings. */

const occasions = [
  { id: 'birthday', label: 'Birthday', hint: 'Bouquets & keepsakes', query: 'birthday' },
  { id: 'anniversary', label: 'Anniversary', hint: 'Something to keep', query: 'anniversary' },
  { id: 'housewarming', label: 'Housewarming', hint: 'For a new home', query: 'housewarming' },
  { id: 'graduation', label: 'Graduation', hint: 'Class of this year', query: 'school' },
  { id: 'valentines', label: "Valentine's", hint: 'Roses & small charms', query: 'valentine' },
  { id: 'thank-you', label: 'Thank you', hint: 'Small gestures', query: 'gift' },
  { id: 'for-kids', label: 'For kids', hint: 'Soft & playful', query: 'kids' },
  { id: 'beach-trip', label: 'Beach trip', hint: 'Coastal souvenirs', query: 'beach' }
];

function occasionCount(occasion) {
  return searchProducts(occasion.query).length;
}

/* ================= Price bands ================= */

const priceBands = [
  { id: 'u250', label: 'Under ₱250', hint: 'Pocket-size picks' },
  { id: 'r250-500', label: '₱250 – ₱500', hint: 'Everyday gifts' },
  { id: 'r500-1000', label: '₱500 – ₱1,000', hint: 'Something bigger' },
  { id: 'o1000', label: '₱1,000 & up', hint: 'Statement pieces' }
];

function priceBandCount(band) {
  let lo = null;
  let hi = null;
  if (band.id === 'u250') hi = 250;
  else if (band.id === 'r250-500') { lo = 250; hi = 500; }
  else if (band.id === 'r500-1000') { lo = 500; hi = 1000; }
  else if (band.id === 'o1000') lo = 1000;
  return products.filter((p) => (lo === null || p.price >= lo) && (hi === null || p.price <= hi)).length;
}

/* ================= Lookup helpers ================= */

function findCategory(id) {
  return categories.find((c) => c.id === id) || null;
}

function findSeller(id) {
  return sellers.find((s) => s.id === id) || null;
}

function findProduct(id) {
  return products.find((p) => p.id === id) || null;
}

function findCoupon(code) {
  const needle = String(code || '').trim().toUpperCase();
  if (!needle) return null;
  return coupons.find((c) => c.code === needle) || null;
}

function productsBySeller(sellerId) {
  return products.filter((p) => p.sellerId === sellerId);
}

function productsByCategory(categoryId) {
  return products.filter((p) => p.categoryId === categoryId);
}

function sellerRating(sellerId) {
  const list = productsBySeller(sellerId);
  const total = list.reduce((sum, p) => sum + p.reviews, 0);
  if (!total) return 0;
  return list.reduce((sum, p) => sum + p.rating * p.reviews, 0) / total;
}

function sellerProductCount(sellerId) {
  return productsBySeller(sellerId).length;
}

function sellerSales(sellerId) {
  return productsBySeller(sellerId).reduce((sum, p) => sum + p.sales, 0);
}

function categoryCount(categoryId) {
  return productsByCategory(categoryId).length;
}

function searchProducts(query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return [];
  return products.filter((p) => {
    const cat = findCategory(p.categoryId);
    const shop = findSeller(p.sellerId);
    const haystack = [
      p.name,
      p.description,
      cat ? cat.name : '',
      shop ? shop.storeName : '',
      (p.tags || []).join(' ')
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}
