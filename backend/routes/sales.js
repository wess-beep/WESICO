const router = require('express').Router();
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const { auth, roles } = require('../middleware/auth');

// Create sale (cashier, manager, admin)
router.post('/', auth, async (req, res) => {
  try {
    const { items, paymentMethod, amountPaid, discount, tax } = req.body;
    let subtotal = 0;
    let totalProfit = 0;
    const enrichedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ message: `Product ${item.productId} not found` });
      if (product.stock < item.quantity) return res.status(400).json({ message: `Insufficient stock for ${product.name}` });

      const itemSubtotal = product.price * item.quantity;
      const itemProfit = (product.price - product.costPrice) * item.quantity;
      subtotal += itemSubtotal;
      totalProfit += itemProfit;

      enrichedItems.push({
        product: product._id,
        productName: product.name,
        barcode: product.barcode,
        quantity: item.quantity,
        unitPrice: product.price,
        costPrice: product.costPrice,
        subtotal: itemSubtotal,
        profit: itemProfit
      });

      // Deduct stock
      await Product.findByIdAndUpdate(product._id, { $inc: { stock: -item.quantity } });
    }

    const taxAmount = tax || 0;
    const discountAmount = discount || 0;
    const total = subtotal + taxAmount - discountAmount;

    const sale = new Sale({
      items: enrichedItems,
      subtotal,
      tax: taxAmount,
      discount: discountAmount,
      total,
      totalProfit,
      paymentMethod,
      amountPaid,
      change: amountPaid ? amountPaid - total : 0,
      cashier: req.user._id,
      cashierName: req.user.name
    });

    await sale.save();
    res.status(201).json(sale);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get sales (manager, admin)
router.get('/', auth, roles('admin', 'manager'), async (req, res) => {
  try {
    const { startDate, endDate, cashier, page = 1, limit = 50 } = req.query;
    let query = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(new Date(endDate).setHours(23,59,59));
    }
    if (cashier) query.cashier = cashier;

    const sales = await Sale.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Sale.countDocuments(query);
    res.json({ sales, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single sale
router.get('/:id', auth, roles('admin', 'manager'), async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id).populate('cashier', 'name');
    res.json(sale);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
