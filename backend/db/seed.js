require('dotenv').config({ path: __dirname + '/../.env' });
const { query } = require('./index');

const sampleRestaurants = [
  {
    name: 'The Spice Symphony',
    description: 'Authentic Indian curries and tandoor specialties with a modern twist.',
    address: '123 MG Road, Indiranagar',
    city: 'Bangalore',
    pincode: '560038',
    image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800',
    avg_rating: 4.8,
    total_reviews: 342,
    is_open: true
  },
  {
    name: 'Mumbai Local Bites',
    description: 'Experience the street food of Mumbai in a premium setting. Vada Pav, Pav Bhaji, and more.',
    address: '456 Linking Road, Bandra West',
    city: 'Mumbai',
    pincode: '400050',
    image_url: 'https://images.unsplash.com/photo-1589302168068-964664d93cb0?auto=format&fit=crop&q=80&w=800',
    avg_rating: 4.6,
    total_reviews: 215,
    is_open: true
  },
  {
    name: 'Delhi Darbar',
    description: 'Rich Mughlai cuisine featuring the best butter chicken and garlic naan in town.',
    address: '789 Connaught Place',
    city: 'Delhi',
    pincode: '110001',
    image_url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&q=80&w=800',
    avg_rating: 4.9,
    total_reviews: 512,
    is_open: true
  },
  {
    name: 'Bake & Brew Cafe',
    description: 'Freshly brewed artisanal coffee, sourdough pastries, and a cozy atmosphere.',
    address: '101 Koramangala 5th Block',
    city: 'Bangalore',
    pincode: '560095',
    image_url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=800',
    avg_rating: 4.5,
    total_reviews: 189,
    is_open: true
  },
  {
    name: 'Midnight Craving Station',
    description: 'Your late-night savior for rolls, wraps, and loaded fries.',
    address: '222 Juhu Beach Road',
    city: 'Mumbai',
    pincode: '400049',
    image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=800',
    avg_rating: 4.2,
    total_reviews: 430,
    is_open: false
  },
  {
    name: 'South Indian Sizzle',
    description: 'Crispy dosas, fluffy idlis, and the most authentic filter coffee.',
    address: '88 Hauz Khas Village',
    city: 'Delhi',
    pincode: '110016',
    image_url: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?auto=format&fit=crop&q=80&w=800',
    avg_rating: 4.7,
    total_reviews: 290,
    is_open: true
  }
];

async function seed() {
  console.log('🌱 Seeding database with dummy restaurants...');
  try {
    for (const r of sampleRestaurants) {
      await query(
        `INSERT INTO restaurants (name, description, address, city, pincode, image_url, avg_rating, total_reviews, is_open)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [r.name, r.description, r.address, r.city, r.pincode, r.image_url, r.avg_rating, r.total_reviews, r.is_open]
      );
      console.log(`✅ Added: ${r.name}`);
    }
    console.log('🍕 Finished seeding restaurants successfully!');
  } catch (error) {
    console.error('❌ Error seeding restaurants:', error);
  } finally {
    process.exit(0);
  }
}

seed();
