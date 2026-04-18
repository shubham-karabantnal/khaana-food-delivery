const { Pool } = require('pg');
const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));
require('dotenv').config({ path: __dirname + '/../../.env' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ── Categories ──────────────────────────────────────────────
const CATEGORIES = [
  'Starters', 'Rice & Biryani', 'Breads',
  'Main Course', 'South Indian', 'Snacks',
  'Beverages', 'Desserts', 'Chinese', 'Fast Food'
];

// ── Menu templates by cuisine keyword ───────────────────────
const MENUS = {
  indian: [
    { name: 'Paneer Butter Masala',   category: 'Main Course',   price: 180 },
    { name: 'Dal Tadka',              category: 'Main Course',   price: 120 },
    { name: 'Jeera Rice',             category: 'Rice & Biryani',price: 90  },
    { name: 'Butter Naan',            category: 'Breads',        price: 40  },
    { name: 'Veg Samosa (2 pcs)',     category: 'Starters',      price: 50  },
    { name: 'Gulab Jamun',            category: 'Desserts',      price: 60  },
    { name: 'Masala Chaas',           category: 'Beverages',     price: 40  },
  ],
  south_indian: [
    { name: 'Masala Dosa',            category: 'South Indian',  price: 80  },
    { name: 'Plain Dosa',             category: 'South Indian',  price: 60  },
    { name: 'Idli (3 pcs)',           category: 'South Indian',  price: 60  },
    { name: 'Vada (2 pcs)',           category: 'South Indian',  price: 50  },
    { name: 'Uttapam',                category: 'South Indian',  price: 80  },
    { name: 'Sambar Rice',            category: 'Rice & Biryani',price: 90  },
    { name: 'Filter Coffee',          category: 'Beverages',     price: 30  },
    { name: 'Kesari Bath',            category: 'Desserts',      price: 50  },
  ],
  biryani: [
    { name: 'Veg Biryani',            category: 'Rice & Biryani',price: 150 },
    { name: 'Chicken Biryani',        category: 'Rice & Biryani',price: 200 },
    { name: 'Egg Biryani',            category: 'Rice & Biryani',price: 170 },
    { name: 'Mutton Biryani',         category: 'Rice & Biryani',price: 250 },
    { name: 'Raita',                  category: 'Main Course',   price: 40  },
    { name: 'Mirchi Ka Salan',        category: 'Main Course',   price: 60  },
    { name: 'Shahi Tukda',            category: 'Desserts',      price: 80  },
  ],
  chinese: [
    { name: 'Veg Fried Rice',         category: 'Chinese',       price: 120 },
    { name: 'Chicken Fried Rice',     category: 'Chinese',       price: 160 },
    { name: 'Veg Noodles',            category: 'Chinese',       price: 110 },
    { name: 'Chicken Manchurian',     category: 'Chinese',       price: 180 },
    { name: 'Gobi 65',                category: 'Starters',      price: 130 },
    { name: 'Spring Rolls (4 pcs)',   category: 'Starters',      price: 100 },
    { name: 'Sweet Corn Soup',        category: 'Starters',      price: 90  },
  ],
  pizza: [
    { name: 'Margherita Pizza',       category: 'Fast Food',     price: 199 },
    { name: 'Paneer Tikka Pizza',     category: 'Fast Food',     price: 249 },
    { name: 'BBQ Chicken Pizza',      category: 'Fast Food',     price: 279 },
    { name: 'Garlic Bread',           category: 'Snacks',        price: 99  },
    { name: 'Pasta Arrabbiata',       category: 'Main Course',   price: 179 },
    { name: 'Cold Drink',             category: 'Beverages',     price: 60  },
  ],
  fast_food: [
    { name: 'Veg Burger',             category: 'Fast Food',     price: 99  },
    { name: 'Chicken Burger',         category: 'Fast Food',     price: 129 },
    { name: 'French Fries',           category: 'Snacks',        price: 79  },
    { name: 'Aloo Tikki',             category: 'Snacks',        price: 60  },
    { name: 'Cold Coffee',            category: 'Beverages',     price: 89  },
    { name: 'Milkshake',              category: 'Beverages',     price: 99  },
  ],
  default: [
    { name: 'Veg Thali',              category: 'Main Course',   price: 150 },
    { name: 'Chicken Curry',          category: 'Main Course',   price: 200 },
    { name: 'Steamed Rice',           category: 'Rice & Biryani',price: 60  },
    { name: 'Roti (2 pcs)',           category: 'Breads',        price: 30  },
    { name: 'Papad',                  category: 'Starters',      price: 30  },
    { name: 'Sweet Lassi',            category: 'Beverages',     price: 60  },
    { name: 'Ice Cream',              category: 'Desserts',      price: 80  },
  ]
};

// ── Pick menu based on cuisine tag ──────────────────────────
const getMenuKey = (cuisine = '') => {
  const c = cuisine.toLowerCase();
  if (c.includes('south') || c.includes('dosa') || c.includes('udupi')) return 'south_indian';
  if (c.includes('biryani') || c.includes('hyderabadi'))                 return 'biryani';
  if (c.includes('chinese') || c.includes('indo_chinese'))               return 'chinese';
  if (c.includes('pizza') || c.includes('italian'))                      return 'pizza';
  if (c.includes('burger') || c.includes('fast') || c.includes('cafe'))  return 'fast_food';
  if (c.includes('indian') || c.includes('north') || c.includes('mughal')) return 'indian';
  return 'default';
};

// ── Fetch from OpenStreetMap ─────────────────────────────────
const fetchFromOSM = async () => {
  console.log('Fetching restaurants from OpenStreetMap...');
  const query = `
    [out:json][timeout:25];
    node["amenity"="restaurant"](around:8000,12.9716,77.5946);
    out 30;
  `;
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { 'Accept': 'application/json' }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OSM API failed: ${res.status} ${text.substring(0, 100)}`);
  }
  const data = await res.json();
  console.log(`Found ${data.elements.length} restaurants on OSM`);
  return data.elements;
};

// ── Main seed function ───────────────────────────────────────
const seed = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Seed categories
    console.log('\nSeeding categories...');
    const categoryIds = {};
    for (const cat of CATEGORIES) {
      const res = await client.query(
        `INSERT INTO categories (name) VALUES ($1)
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [cat]
      );
      categoryIds[cat] = res.rows[0].id;
    }
    console.log(`✓ ${CATEGORIES.length} categories ready`);

    // 2. Fetch OSM data
    const osmData = await fetchFromOSM();

    // 3. Seed restaurants + menus
    console.log('\nSeeding restaurants and menus...');
    let restCount = 0;
    let menuCount = 0;

    for (const r of osmData) {
      const name     = r.tags?.name;
      const lat      = r.lat;
      const lng      = r.lon;
      const cuisine  = r.tags?.cuisine || '';
      const city     = r.tags?.['addr:city'] || 'Bangalore';
      const pincode  = r.tags?.['addr:postcode'] || '560001';
      const street   = r.tags?.['addr:street'] || '';
      const address  = street ? `${street}, ${city}` : `${city}, Karnataka`;
      
      if (!name) continue;

      // Insert restaurant
      const restRes = await client.query(
        `INSERT INTO restaurants
           (name, description, address, city, pincode, lat, lng)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [
          name,
          cuisine ? `${cuisine.replace(/_/g, ' ')} cuisine` : 'Multi-cuisine restaurant',
          address,
          city,
          pincode,
          lat,
          lng
        ]
      );

      if (restRes.rows.length === 0) continue; // already exists

      const restaurantId = restRes.rows[0].id;
      restCount++;

      // Insert menu items
      const menuKey   = getMenuKey(cuisine);
      const menuItems = MENUS[menuKey];

      for (const item of menuItems) {
        const catId = categoryIds[item.category];
        await client.query(
          `INSERT INTO menu_items
             (restaurant_id, category_id, name, price, is_available)
           VALUES ($1, $2, $3, $4, TRUE)`,
          [restaurantId, catId, item.name, item.price]
        );
        menuCount++;
      }

      console.log(`  ✓ ${name} (${menuKey}) — ${menuItems.length} items`);
    }

    await client.query('COMMIT');

    console.log(`\n✅ Seeding complete!`);
    console.log(`   Restaurants : ${restCount}`);
    console.log(`   Menu items  : ${menuCount}`);
    console.log(`   Categories  : ${CATEGORIES.length}`);

  } catch (err) {
    if (client) await client.query('ROLLBACK');
    console.error('Seed failed — rolled back.', err.message);
  } finally {
    if (client) client.release();
    pool.end();
  }
};

seed();
