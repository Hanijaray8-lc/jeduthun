const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: 0
  },
  // unit: {
  //   type: String,
  //   default: 'pcs',
  //   trim: true
  // },
  // hsn: {
  //   type: String,
  //   trim: true,
  //   default: ''
  // },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);
