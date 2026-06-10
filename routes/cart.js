const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const { isAuthenticated } = require('../middleware/auth');

router.use(isAuthenticated);

router.get('/', async (req, res) => {
  const cart = req.session.cart || [];
  const productIds = cart.map(item => item.productId);
  const products = await Product.find({ _id: { $in: productIds } });

  const cartItems = cart.map(item => {
    const product = products.find(p => p._id.toString() === item.productId);
    return {
      productId: item.productId,
      name: product ? product.name : 'ไม่พบสินค้า',
      price: product ? product.price : 0,
      quantity: item.quantity,
      stock: product ? product.stock : 0
    };
  });

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  res.render('cart', { title: 'ตะกร้าสินค้า - ร้านขายรหัสเกม', cart: cartItems, total, user: res.locals.user });
});

router.post('/add/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || !product.isActive) {
      req.flash('error', 'ไม่พบสินค้าหรือสินค้าหมด');
      return res.redirect('back');
    }

    const quantity = parseInt(req.body.quantity) || 1;
    if (quantity > product.stock) {
      req.flash('error', `สินค้ามีไม่เพียงพอ (เหลือ ${product.stock} ชิ้น)`);
      return res.redirect('back');
    }

    if (!req.session.cart) req.session.cart = [];

    const existingIndex = req.session.cart.findIndex(item => item.productId === req.params.id);
    if (existingIndex > -1) {
      const newQty = req.session.cart[existingIndex].quantity + quantity;
      if (newQty > product.stock) {
        req.flash('error', `สินค้ามีไม่เพียงพอ (เหลือ ${product.stock} ชิ้น)`);
        return res.redirect('back');
      }
      req.session.cart[existingIndex].quantity = newQty;
    } else {
      req.session.cart.push({ productId: req.params.id, quantity });
    }

    req.flash('success', 'เพิ่มสินค้าลงตะกร้าแล้ว');
    res.redirect('back');
  } catch (err) {
    console.error(err);
    req.flash('error', 'เกิดข้อผิดพลาด');
    res.redirect('back');
  }
});

router.post('/update/:id', (req, res) => {
  const quantity = parseInt(req.body.quantity);
  if (quantity < 1) {
    req.session.cart = (req.session.cart || []).filter(item => item.productId !== req.params.id);
  } else {
    const idx = (req.session.cart || []).findIndex(item => item.productId === req.params.id);
    if (idx > -1) req.session.cart[idx].quantity = quantity;
  }
  req.flash('success', 'อัปเดตตะกร้าแล้ว');
  res.redirect('/cart');
});

router.post('/remove/:id', (req, res) => {
  req.session.cart = (req.session.cart || []).filter(item => item.productId !== req.params.id);
  req.flash('success', 'ลบสินค้าออกจากตะกร้าแล้ว');
  res.redirect('/cart');
});

router.post('/checkout', async (req, res) => {
  try {
    const cart = req.session.cart || [];
    if (cart.length === 0) {
      req.flash('error', 'ตะกร้าสินค้าว่าง');
      return res.redirect('/cart');
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
      req.flash('error', 'ไม่พบผู้ใช้');
      return res.redirect('/signin');
    }

    let total = 0;
    const items = [];

    for (const item of cart) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) {
        req.flash('error', `สินค้า ${product ? product.name : item.productId} ไม่สามารถซื้อได้`);
        return res.redirect('/cart');
      }

      const qty = item.quantity;
      if (qty > product.stock) {
        req.flash('error', `สินค้า ${product.name} มีไม่เพียงพอ (เหลือ ${product.stock})`);
        return res.redirect('/cart');
      }

      const codesToAssign = product.codes.splice(0, qty);
      if (codesToAssign.length < qty) {
        req.flash('error', `สินค้า ${product.name} คงเหลือไม่เพียงพอ`);
        return res.redirect('/cart');
      }

      for (let i = 0; i < qty; i++) {
        items.push({
          product: product._id,
          productName: product.name,
          price: product.price,
          code: codesToAssign[i] || 'รอตรวจสอบ'
        });
      }

      total += product.price * qty;
      product.stock -= qty;
      product.sold += qty;
      product.codes = product.codes;
      await product.save();
    }

    if (user.balance < total) {
      req.flash('error', `ยอดเงินไม่เพียงพอ กรุณาเติมเงิน (ต้องการ ${total} บาท มี ${user.balance} บาท)`);
      return res.redirect('/cart');
    }

    user.balance -= total;
    await user.save();

    req.session.balance = user.balance;

    const order = new Order({
      user: user._id,
      items,
      total
    });
    await order.save();

    req.session.cart = [];

    req.flash('success', 'ชำระเงินสำเร็จ! รหัสสินค้าของคุณอยู่ด้านล่าง');
    res.redirect(`/cart/order/${order._id}`);
  } catch (err) {
    console.error(err);
    req.flash('error', 'เกิดข้อผิดพลาดในการชำระเงิน');
    res.redirect('/cart');
  }
});

router.get('/order/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user');
    if (!order || order.user._id.toString() !== req.session.userId) {
      req.flash('error', 'ไม่พบออเดอร์');
      return res.redirect('/');
    }
    res.render('order_detail', { title: 'รายละเอียดออเดอร์', order });
  } catch (err) {
    console.error(err);
    req.flash('error', 'เกิดข้อผิดพลาด');
    res.redirect('/');
  }
});

router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find({ user: req.session.userId }).sort({ createdAt: -1 });
    res.render('orders', { title: 'ประวัติการสั่งซื้อ - ร้านขายรหัสเกม', orders });
  } catch (err) {
    console.error(err);
    req.flash('error', 'เกิดข้อผิดพลาด');
    res.redirect('/');
  }
});

module.exports = router;
