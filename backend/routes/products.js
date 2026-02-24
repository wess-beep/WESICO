const router = require('express').Router();
const Product = require('../models/Product');
const { auth, roles } = require('../middleware/auth');

// Get all products (all roles)
router.get('/', auth, async (req, res) => {
  try {
    const { search, category, lowStock } = req.query;
    let query = { active: true };
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { barcode: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } }
    ];
    if (category) query.category = category;
    if (lowStock === 'true') query.$expr = { $lte: ['$stock', '$lowStockAlert'] };
    const products = await Product.find(query).sort({ name: 1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get by barcode (cashier use)
router.get('/barcode/:barcode', auth, async (req, res) => {
  try {
    const product = await Product.findOne({ barcode: req.params.barcode, active: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create (admin only)
router.post('/', auth, roles('admin'), async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update (admin only)
router.put('/:id', auth, roles('admin'), async (req, res) => {
  try {
    req.body.updatedAt = new Date();
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete (admin only)
router.delete('/:id', auth, roles('admin'), async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { active: false });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
