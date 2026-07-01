const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// GET all products
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let query = { isActive: true };

    if (search) {
      const trimmed = search.trim();
      const regex = { $regex: escapeRegex(trimmed), $options: 'i' };
      const filters = [{ name: regex }, { description: regex }];
      const numeric = Number(trimmed);
      if (!Number.isNaN(numeric)) {
        filters.push({ amount: numeric });
      }
      query.$or = filters;
    }

    const products = await Product.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create product
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    const existingProduct = await Product.findOne({
      name: { $regex: `^${escapeRegex(name || '')}$`, $options: 'i' },
      isActive: true,
    });

    if (existingProduct) {
      return res.status(409).json({
        success: false,
        message: 'Product already exists',
      });
    }

    const product = new Product(req.body);
    await product.save();
    res.status(201).json({ success: true, data: product, message: 'Product added successfully' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT update product
router.put('/:id', async (req, res) => {
  try {
    const { name } = req.body;
    const existingProduct = await Product.findOne({
      _id: { $ne: req.params.id },
      name: { $regex: `^${escapeRegex(name || '')}$`, $options: 'i' },
      isActive: true,
    });

    if (existingProduct) {
      return res.status(409).json({
        success: false,
        message: 'Product already exists',
      });
    }

    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product, message: 'Product updated successfully' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE product
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
