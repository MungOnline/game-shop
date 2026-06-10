const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const Topup = require('../models/Topup');
const { isAuthenticated } = require('../middleware/auth');
const { getSettings } = require('../config/settings');

const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: (req, file, cb) => {
    cb(null, `slip_${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage });

router.get('/', isAuthenticated, async (req, res) => {
  const settings = await getSettings();
  res.render('topup', { title: 'เติมเงิน - ร้านขายรหัสเกม', settings });
});

router.post('/', isAuthenticated, upload.single('slip'), async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount < 10) {
      req.flash('error', 'กรุณากรอกจำนวนเงินขั้นต่ำ 10 บาท');
      return res.redirect('/topup');
    }

    const topup = new Topup({
      user: req.session.userId,
      amount: parseFloat(amount),
      slipImage: req.file ? req.file.filename : ''
    });
    await topup.save();

    req.flash('success', 'ส่งคำขอเติมเงินเรียบร้อย รอแอดมินอนุมัติ');
    res.redirect('/');
  } catch (err) {
    console.error(err);
    req.flash('error', 'เกิดข้อผิดพลาด');
    res.redirect('/topup');
  }
});

module.exports = router;
