const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { upload } = require('../utils/cloudinary');

const router = express.Router();

/**
 * @route POST /api/upload
 * @desc Upload image to Cloudinary and return URL
 * @access Private (admin, restaurant_owner)
 */
router.post('/', authenticateToken, requireRole(['admin', 'restaurant_owner']), upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    // Return the secure URL from Cloudinary
    res.json({ imageUrl: req.file.path });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

module.exports = router;
