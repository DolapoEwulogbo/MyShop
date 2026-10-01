// Phase 2 mock catalogue — same shape as Supabase products.
// Replaced by productService.js reading Supabase in Phase 4.
export const mockProducts = [
  {
    id: 'tote',
    name: 'Canvas Tote Bag',
    description: 'Sturdy everyday tote in natural cotton canvas with an inner zip pocket.',
    price: 8500,
    image_url: 'https://picsum.photos/seed/tote/600/600',
    stock: 40
  },
  {
    id: 'mug',
    name: 'Ceramic Coffee Mug',
    description: 'Hand-glazed 350ml mug. Dishwasher and microwave safe.',
    price: 4500,
    image_url: 'https://picsum.photos/seed/mug/600/600',
    stock: 60
  },
  {
    id: 'pillow',
    name: 'Linen Throw Pillow',
    description: 'Soft 45x45cm linen cover with a removable insert.',
    price: 12000,
    image_url: 'https://picsum.photos/seed/pillow/600/600',
    stock: 25
  },
  {
    id: 'candle',
    name: 'Scented Soy Candle',
    description: 'Slow-burning soy wax candle, about 40 hours. Lemongrass and ginger.',
    price: 7000,
    image_url: 'https://picsum.photos/seed/candle/600/600',
    stock: 30
  },
  {
    id: 'notebook',
    name: 'Leather Notebook',
    description: 'A5 notebook with 160 cream pages and a genuine leather cover.',
    price: 15000,
    image_url: 'https://picsum.photos/seed/notebook/600/600',
    stock: 18
  },
  {
    id: 'earbuds',
    name: 'Wireless Earbuds',
    description: 'Bluetooth 5.3 earbuds with a charging case and up to 20 hours total playback.',
    price: 32000,
    image_url: 'https://picsum.photos/seed/earbuds/600/600',
    stock: 12
  },
  {
    id: 'bottle',
    name: 'Insulated Water Bottle',
    description: '750ml stainless steel bottle. Keeps drinks cold 24 hours, hot 12 hours.',
    price: 11000,
    image_url: 'https://picsum.photos/seed/bottle/600/600',
    stock: 3
  },
  {
    id: 'lamp',
    name: 'Desk Lamp',
    description: 'Adjustable LED desk lamp with three brightness levels and a USB port.',
    price: 19500,
    image_url: 'https://picsum.photos/seed/lamp/600/600',
    stock: 0
  }
]

export function getMockProductById(id) {
  return mockProducts.find((p) => p.id === id) ?? null
}
