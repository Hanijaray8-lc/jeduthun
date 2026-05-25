const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    default: null
  },
  name: { type: String, required: true, trim: true },
  //hsn: { type: String, default: '', trim: true },
  quantity: { type: Number, required: true, min: 1 },
  // unit: { type: String, default: 'pcs' },
  amount: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true }
});

const invoiceSchema = new mongoose.Schema({
  invoiceNo: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  customer: {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, trim: true, default: '' }
  },
  items: [invoiceItemSchema],
  subtotal: { type: Number, required: true },
  gstRate: { type: Number, default: 18 },
  gstAmount: { type: Number, required: true },

// NEW
  cgstRate: { type: Number, default: 9 },
  sgstRate: { type: Number, default: 9 },

  cgstAmount: { type: Number, default: 0 },
  sgstAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  totalInWords: { type: String, default: '' },
  notes: { type: String, default: '' },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'partial'],
    default: 'pending'
  },
  type: {
    type: String,
    enum: ['invoice', 'quotation'],
    default: 'invoice'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Invoice', invoiceSchema);
