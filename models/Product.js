const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  price: {
    type: Number,
    required: true
  },
  stock: {
    type: Number,
    default: 0
  },
  sold: {
    type: Number,
    default: 0
  },
  category: {
    type: String,
    default: 'ทั่วไป'
  },
  image: {
    type: String,
    default: 'default.svg'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  codes: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Product', productSchema);
