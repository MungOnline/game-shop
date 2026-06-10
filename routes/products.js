const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = { isActive: true };

    if (category) query.category = category;
    if (search) query.name = { $regex: search, $options: 'i' };

    const products = await Product.find(query).sort({ createdAt: -1 });
    const categories = await Product.distinct('category');

    res.render('products', {
      title: 'สินค้าทั้งหมด - ร้านขายรหัสเกม',
      products,
      categories,
      selectedCategory: category || '',
      search: search || ''
    });
  } catch (err) {
    console.error(err);
    res.render('products', { title: 'สินค้าทั้งหมด - ร้านขายรหัสเกม', products: [], categories: [], selectedCategory: '', search: '' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      req.flash('error', 'ไม่พบสินค้า');
      return res.redirect('/products');
    }
    res.render('product_detail', { title: `${product.name} - ร้านขายรหัสเกม`, product });
  } catch (err) {
    console.error(err);
    req.flash('error', 'เกิดข้อผิดพลาด');
    res.redirect('/products');
  }
});

module.exports = router;
