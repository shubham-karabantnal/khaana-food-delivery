require('dotenv').config();
const { pool } = require('../db');

async function fixPhoneConstraint() {
  console.log('--- Starting Phone Constraint Fix ---');
  const client = await pool.connect();
  try {
    // Check for users with empty string phone
    const checkRes = await client.query('SELECT COUNT(*) FROM users WHERE phone = \'\'');
    const count = parseInt(checkRes.rows[0].count);
    console.log(`Found ${count} users with empty phone strings.`);

    if (count > 0) {
      console.log('Updating empty strings to NULL...');
      const updateRes = await client.query('UPDATE users SET phone = NULL WHERE phone = \'\'');
      console.log(`Updated ${updateRes.rowCount} users.`);
    }

    console.log('--- Fix Completed Successfully ---');
  } catch (err) {
    console.error('Error during fix:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

fixPhoneConstraint();
