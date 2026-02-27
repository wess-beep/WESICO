const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  barcode: { type: String, unique: true, sparse: true },
  sku: { type: String },
  category: { type: String, default: 'General' },
  price: { type: Number, required: true },
  costPrice: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  lowStockAlert: { type: Number, default: 10 },
  unit: { type: String, default: 'pcs' },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

productSchema.virtual('profit').get(function() {
  return this.price - this.costPrice;
});

productSchema.virtual('profitMargin').get(function() {
  return this.price > 0 ? ((this.price - this.costPrice) / this.price * 100).toFixed(2) : 0;
});

module.exports = mongoose.model('Product', productSchema);
