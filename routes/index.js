const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const User = require('../models/User');
const { getSettings } = require('../config/settings');

router.get('/', async (req, res) => {
  try {
    const featuredProducts = await Product.find({ isActive: true }).sort({ createdAt: -1 }).limit(12);
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalSold = await Product.aggregate([{ $group: { _id: null, total: { $sum: '$sold' } } }]);
    const totalAvailable = await Product.countDocuments({ isActive: true, stock: { $gt: 0 } });
    
    res.render('index', {
      title: 'หน้าหลัก - ร้านขายรหัสเกม',
      products: featuredProducts,
      stats: {
        users: totalUsers,
        products: totalProducts,
        available: totalAvailable,
        sold: totalSold.length > 0 ? totalSold[0].total : 0
      }
    });
  } catch (err) {
    console.error(err);
    res.render('index', { title: 'หน้าหลัก - ร้านขายรหัสเกม', products: [], stats: { users: 0, products: 0, available: 0, sold: 0 } });
  }
});

router.get('/info', async (req, res) => {
  const settings = await getSettings();
  res.render('info', { title: 'ติดต่อเรา - ร้านขายรหัสเกม', settings });
});

router.get('/blog', async (req, res) => {
  const settings = await getSettings();
  res.render('blog', { title: 'ช่วยเหลือ - ร้านขายรหัสเกม', settings });
});

module.exports = router;
