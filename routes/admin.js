const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Topup = require('../models/Topup');
const Setting = require('../models/Setting');
const { isAdmin } = require('../middleware/auth');
const { getSettings, clearCache } = require('../config/settings');

router.use(isAdmin);

const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: (req, file, cb) => {
    cb(null, `product_${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage });

router.get('/', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const pendingTopups = await Topup.countDocuments({ status: 'pending' });
    const recentOrders = await Order.find().populate('user').sort({ createdAt: -1 }).limit(10);

    res.render('admin/dashboard', {
      title: 'แผงควบคุม - แอดมิน',
      stats: { users: totalUsers, products: totalProducts, orders: totalOrders, pendingTopups },
      recentOrders
    });
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
});

router.get('/products', async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });
  res.render('admin/products', { title: 'จัดการสินค้า - แอดมิน', products });
});

router.get('/products/create', (req, res) => {
  res.render('admin/product_form', { title: 'เพิ่มสินค้า - แอดมิน', product: null });
});

router.post('/products/create', upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, stock, category } = req.body;
    const codes = req.body.codes ? req.body.codes.split('\n').map(c => c.trim()).filter(c => c) : [];

    const product = new Product({
      name,
      description,
      price: parseFloat(price),
      stock: parseInt(stock) + codes.length,
      category,
      codes,
      image: req.file ? req.file.filename : 'default.png'
    });
    await product.save();

    req.flash('success', 'เพิ่มสินค้าสำเร็จ');
    res.redirect('/admin/products');
  } catch (err) {
    console.error(err);
    req.flash('error', 'เกิดข้อผิดพลาด');
    res.redirect('/admin/products/create');
  }
});

router.get('/products/edit/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      req.flash('error', 'ไม่พบสินค้า');
      return res.redirect('/admin/products');
    }
    res.render('admin/product_form', { title: 'แก้ไขสินค้า - แอดมิน', product });
  } catch (err) {
    console.error(err);
    res.redirect('/admin/products');
  }
});

router.post('/products/edit/:id', upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, stock, category } = req.body;
    const product = await Product.findById(req.params.id);

    product.name = name;
    product.description = description;
    product.price = parseFloat(price);
    product.stock = parseInt(stock);
    product.category = category;
    if (req.file) product.image = req.file.filename;

    await product.save();

    req.flash('success', 'อัปเดตสินค้าเรียบร้อย');
    res.redirect('/admin/products');
  } catch (err) {
    console.error(err);
    req.flash('error', 'เกิดข้อผิดพลาด');
    res.redirect(`/admin/products/edit/${req.params.id}`);
  }
});

router.post('/products/delete/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    req.flash('success', 'ลบสินค้าเรียบร้อย');
  } catch (err) {
    req.flash('error', 'เกิดข้อผิดพลาด');
  }
  res.redirect('/admin/products');
});

router.post('/products/toggle/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    product.isActive = !product.isActive;
    await product.save();
    req.flash('success', `สินค้าถูก${product.isActive ? 'เปิด' : 'ปิด'}การแสดงผลแล้ว`);
  } catch (err) {
    req.flash('error', 'เกิดข้อผิดพลาด');
  }
  res.redirect('/admin/products');
});

router.post('/products/add-codes/:id', async (req, res) => {
  try {
    const { codes } = req.body;
    const product = await Product.findById(req.params.id);
    const newCodes = codes.split('\n').map(c => c.trim()).filter(c => c);
    product.codes.push(...newCodes);
    product.stock += newCodes.length;
    await product.save();
    req.flash('success', `เพิ่ม ${newCodes.length} รหัสเรียบร้อย`);
  } catch (err) {
    req.flash('error', 'เกิดข้อผิดพลาด');
  }
  res.redirect('/admin/products');
});

router.get('/orders', async (req, res) => {
  const orders = await Order.find().populate('user').sort({ createdAt: -1 });
  res.render('admin/orders', { title: 'จัดการออเดอร์ - แอดมิน', orders });
});

router.post('/orders/cancel/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (order) {
      order.status = 'cancelled';
      await order.save();
      req.flash('success', 'ยกเลิกออเดอร์แล้ว');
    }
  } catch (err) {
    req.flash('error', 'เกิดข้อผิดพลาด');
  }
  res.redirect('/admin/orders');
});

router.get('/topups', async (req, res) => {
  const topups = await Topup.find().populate('user').sort({ createdAt: -1 });
  res.render('admin/topups', { title: 'จัดการเติมเงิน - แอดมิน', topups });
});

router.post('/topups/approve/:id', async (req, res) => {
  try {
    const topup = await Topup.findById(req.params.id);
    if (topup && topup.status === 'pending') {
      topup.status = 'approved';
      await topup.save();

      const user = await User.findById(topup.user);
      user.balance += topup.amount;
      await user.save();

      req.flash('success', `อนุมัติเติมเงิน ${topup.amount} บาทให้ ${user.username} เรียบร้อย`);
    }
  } catch (err) {
    req.flash('error', 'เกิดข้อผิดพลาด');
  }
  res.redirect('/admin/topups');
});

router.post('/topups/reject/:id', async (req, res) => {
  try {
    await Topup.findByIdAndUpdate(req.params.id, { status: 'rejected' });
    req.flash('success', 'ปฏิเสธคำขอเติมเงินแล้ว');
  } catch (err) {
    req.flash('error', 'เกิดข้อผิดพลาด');
  }
  res.redirect('/admin/topups');
});

router.get('/users', async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.render('admin/users', { title: 'จัดการผู้ใช้ - แอดมิน', users });
});

router.post('/users/toggle-admin/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user && user._id.toString() !== req.session.userId) {
      user.role = user.role === 'admin' ? 'user' : 'admin';
      await user.save();
      req.flash('success', `เปลี่ยนสิทธิ์ ${user.username} เป็น ${user.role}`);
    }
  } catch (err) {
    req.flash('error', 'เกิดข้อผิดพลาด');
  }
  res.redirect('/admin/users');
});

router.get('/settings', async (req, res) => {
  try {
    const settings = await getSettings();
    res.render('admin/settings', { title: 'ตั้งค่าเว็บไซต์ - แอดมิน', settings });
  } catch (err) {
    console.error(err);
    res.redirect('/admin');
  }
});

router.post('/settings', async (req, res) => {
  try {
    const {
      facebook, youtube, discord, contactEmail,
      bankName, bankAccount, bankHolder,
      workingHoursWeekday, workingHoursWeekend,
      helpHowToOrder, helpFAQ
    } = req.body;

    let settings = await Setting.findOne();
    if (!settings) settings = new Setting();

    settings.facebook = facebook;
    settings.youtube = youtube;
    settings.discord = discord;
    settings.contactEmail = contactEmail;
    settings.bankName = bankName;
    settings.bankAccount = bankAccount;
    settings.bankHolder = bankHolder;
    settings.workingHoursWeekday = workingHoursWeekday;
    settings.workingHoursWeekend = workingHoursWeekend;
    settings.helpHowToOrder = helpHowToOrder;
    settings.helpFAQ = helpFAQ;

    await settings.save();
    clearCache();
    req.flash('success', 'บันทึกการตั้งค่าเรียบร้อย');
    res.redirect('/admin/settings');
  } catch (err) {
    console.error(err);
    req.flash('error', 'เกิดข้อผิดพลาด');
    res.redirect('/admin/settings');
  }
});

module.exports = router;
