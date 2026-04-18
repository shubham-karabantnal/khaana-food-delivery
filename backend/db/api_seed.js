require('dotenv').config({ path: __dirname + '/../.env' });
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { getClient, query } = require('./index');

const API_BASE_URL = 'https://fakerestaurantapi.runasp.net/api';

async function seedFromApi() {
  console.log('🚀 Starting API-driven database seeding...');
  const client = await getClient();

  try {
    // 1. Cleanup existing data (Optional: User might want to keep some, but for a fresh start better to clear)
    console.log('🧹 Cleaning up old restaurant and menu data...');
    await client.query('BEGIN');
    await client.query('DELETE FROM order_items');
    await client.query('DELETE FROM cart');
    await client.query('DELETE FROM reviews');
    await client.query('DELETE FROM orders');
    await client.query('DELETE FROM menu_items');
    await client.query('DELETE FROM restaurants');
    await client.query('COMMIT');

    // 2. Fetch Restaurants from External API
    console.log('📡 Fetching restaurants from API...');
    const restResponse = await fetch(`${API_BASE_URL}/Restaurant`);
    if (!restResponse.ok) throw new Error('Failed to fetch restaurants');
    const externalRestaurants = await restResponse.json();
    console.log(`✅ Found ${externalRestaurants.length} restaurants.`);

    // 3. Unique Image Mapping (Curated for 31 venues)
    const IMAGE_MAPPING = {
      "Bukhara": "vqjY59vUUH8",            // Iconic North Indian
      "Karim’s": "WT9s9Tzyzng",           // Iconic Mughlai
      "Peter Cat": "vG-HDgrepRg",         // Iconic Kolkata Continental
      "Toit Brewery": "kufY1HyGEO8",      // Iconic Brewery
      "Indian Accent": "pA0u84G_XDs",     // Modern Fine Dining
      "Bawarchi": "Ims_4vVv8tA",          // Biryani Specialist
      "Paradise Biryani": "L-fAt79wYVs",  // Biryani Specialist
      "Pista House": "4YKJEce6vU8",       // Middle Eastern/Haleem
      "Britannia & Co.": "_vIwzh9anNg",   // Parsi/Colonial
      "6 Ballygunge Place": "LcDWGTIXMZo", // Bengali Traditional
      "Mavalli Tiffin Room (MTR)": "9X1Xm5_f-eA", // South Indian Iconic
      "Murugan Idli Shop": "PTqLankeHNg",  // South Indian Casual
      "Koshy’s": "oBYLQVbE8IY",            // Heritage Cafe
      "1135 AD": "LfmUKsRZUxE",           // Royal Rajpoot Style
      "Agashiye": "GrI16P0j1rs",          // Heritage Rooftop
      "Masala Library": "hGAyFWv2Q34",     // Molecular Gastronomy
      "The Table": "yVp9y_vFh50",          // Modern European
      "Jewel of Nizam": "3Ol_AzTi4xI",     // Nizami Luxury
      "Oh! Calcutta": "5mZ8-p_Lh-8",       // Bengali Fine Dining
      "Dakshin": "K7G5wkd-WSA",            // South Indian Fine Dining
      "Sarvi Restaurant": "JX-bEcbdtsc",   // Irani/Persian
      "Shah Ghouse": "X06G96bX-fA",        // Hyderabadi Hub
      "The Fisherman’s Wharf": "ACVu-cqSmw4", // Goan/Coastal
      "Peacock Rooftop Restaurant": "1I-cyn5aar0", // Jaipur Rooftop
      "Rawat Mishtan Bhandar": "dncjnYtmWHo", // Rajasthani Sweets
      "Rajwadu": "RArX6TGMWJw",            // Village Theme
      "Gopi Dining Hall": "haeIrKbJ9PI",   // Gujarati Thali
      "Grand Hotel": "GrshsU4r0gA",        // Heritage Hotel Cafe
      "Alhamdulillah Hotel": "4pT9e68P_mU", // Hyderabadi Local
      "Mumtaz Restaurant": "6JxC2GoC7i4",   // Mughlai
    };

    // Generic fallbacks for any unseen names
    const GENERIC_IDS = ["Ims_4vVv8tA", "L-fAt79wYVs", "4YKJEce6vU8", "pA0u84G_XDs", "_vIwzh9anNg"];

    // 4. Process each restaurant
    for (let i = 0; i < externalRestaurants.length; i++) {
      const extRest = externalRestaurants[i];
      try {
        await client.query('BEGIN');

        // Select Image: Priority Mapping > Specific ID from pool
        const imageId = IMAGE_MAPPING[extRest.restaurantName] || GENERIC_IDS[i % GENERIC_IDS.length];
        const imageUrl = `https://unsplash.com/photos/${imageId}/download?w=1000&q=80`;

        // Insert Restaurant
        const resText = `
          INSERT INTO restaurants (name, description, address, city, image_url, is_open)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id;
        `;
        const city = extRest.address.split(',')[0].trim();
        const restaurantResult = await client.query(resText, [
          extRest.restaurantName,
          `Authentic ${extRest.type} from ${extRest.restaurantName}. Parking: ${extRest.parkingLot ? 'Available' : 'Limited'}.`,
          extRest.address,
          city,
          imageUrl,
          true
        ]);


        const restaurantId = restaurantResult.rows[0].id;

        // 4. Fetch Menu for this restaurant
        console.log(`   🍽️ Fetching menu for: ${extRest.restaurantName}...`);
        const menuResponse = await fetch(`${API_BASE_URL}/Restaurant/${extRest.restaurantID}/menu`);
        if (menuResponse.ok) {
          const menuItems = await menuResponse.json();
          
          for (const item of menuItems) {
            // Find or default a category (Simple heuristic: map to id 2 "Main Course" by default)
            let categoryId = 2; // Main Course
            const name = item.itemName.toLowerCase();
            if (name.includes('starter') || name.includes('soup') || name.includes('kebab')) categoryId = 1;
            if (name.includes('bread') || name.includes('naan') || name.includes('roti')) categoryId = 3;
            if (name.includes('rice') || name.includes('biryani') || name.includes('pulao')) categoryId = 4;
            if (name.includes('dessert') || name.includes('sweet') || name.includes('ice cream')) categoryId = 5;
            if (name.includes('drink') || name.includes('beverage') || name.includes('soda') || name.includes('juice')) categoryId = 6;

            const itemText = `
              INSERT INTO menu_items (restaurant_id, category_id, name, description, price, image_url)
              VALUES ($1, $2, $3, $4, $5, $6)
            `;
            await client.query(itemText, [
              restaurantId,
              categoryId,
              item.itemName,
              item.itemDescription || `Delicious ${item.itemName} at ${extRest.restaurantName}.`,
              item.itemPrice,
              item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800'
            ]);
          }
          console.log(`   ✅ Imported ${menuItems.length} items for ${extRest.restaurantName}.`);
        } else {
          console.warn(`   ⚠️ Could not fetch menu for ${extRest.restaurantName}. Skipping menu.`);
        }

        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`❌ Error seeding ${extRest.restaurantName}:`, err.message);
      }
    }

    console.log('\n✨ Database seeding complete! Your platform is now fully populated.');
  } catch (err) {
    console.error('💥 Fatal Seeding Error:', err.message);
  } finally {
    client.release();
    process.exit(0);
  }
}

seedFromApi();
