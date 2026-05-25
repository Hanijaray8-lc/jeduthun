const express = require('express');
const router = express.Router();
const Shop = require('../models/Shop');

// GET shop details
router.get('/', async (req, res) => {
  try {
    let shop = await Shop.findOne();
    if (!shop) {
      shop = await Shop.create({});
    }
    res.json({ success: true, data: shop });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update shop details
router.put('/', async (req, res) => {
  try {
    let shop = await Shop.findOne();
    if (!shop) {
      shop = await Shop.create(req.body);
    } else {
      shop = await Shop.findByIdAndUpdate(shop._id, req.body, { new: true });
    }
    res.json({ success: true, data: shop, message: 'Shop details updated' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
