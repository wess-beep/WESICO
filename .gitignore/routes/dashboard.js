const router = require('express').Router();
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const { auth, roles } = require('../middleware/auth');

router.get('/', auth, roles('admin', 'manager'), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Today's stats
    const todaySales = await Sale.find({
      createdAt: { $gte: today, $lte: todayEnd },
      status: 'completed'
    });

    const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);
    const todayProfit = todaySales.reduce((sum, s) => sum + s.totalProfit, 0);
    const todayTransactions = todaySales.length;

    // Weekly sales chart
    const weeklySales = await Sale.aggregate([
      { $match: { createdAt: { $gte: weekAgo }, status: 'completed' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$total' },
          profit: { $sum: '$totalProfit' },
          transactions: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Top products today
    const topProducts = await Sale.aggregate([
      { $match: { createdAt: { $gte: today }, status: 'completed' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.productName' },
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.subtotal' },
          profit: { $sum: '$items.profit' }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 }
    ]);

    // Low stock
    const lowStockProducts = await Product.find({
      active: true,
      $expr: { $lte: ['$stock', '$lowStockAlert'] }
    }).select('name stock lowStockAlert barcode').limit(10);

    // Total products
    const totalProducts = await Product.countDocuments({ active: true });

    res.json({
      today: { revenue: todayRevenue, profit: todayProfit, transactions: todayTransactions },
      weeklySales,
      topProducts,
      lowStockProducts,
      totalProducts
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
