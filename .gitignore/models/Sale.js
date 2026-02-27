const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: String,
  barcode: String,
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  costPrice: { type: Number, required: true },
  subtotal: { type: Number, required: true },
  profit: { type: Number, required: true }
});

const saleSchema = new mongoose.Schema({
  receiptNumber: { type: String, unique: true },
  items: [saleItemSchema],
  subtotal: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  totalProfit: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['cash', 'card', 'mobile'], default: 'cash' },
  amountPaid: { type: Number },
  change: { type: Number, default: 0 },
  cashier: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cashierName: String,
  status: { type: String, enum: ['completed', 'refunded', 'void'], default: 'completed' },
  createdAt: { type: Date, default: Date.now }
});

saleSchema.pre('save', function(next) {
  if (!this.receiptNumber) {
    this.receiptNumber = 'RCP-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  }
  next();
});

module.exports = mongoose.model('Sale', saleSchema);
