const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { isNotAuthenticated, isAuthenticated } = require('../middleware/auth');

router.get('/signin', isNotAuthenticated, (req, res) => {
  res.render('signin', { title: 'เข้าสู่ระบบ - ร้านขายรหัสเกม' });
});

router.get('/signup', isNotAuthenticated, (req, res) => {
  res.render('signup', { title: 'สมัครสมาชิก - ร้านขายรหัสเกม' });
});

router.post('/signup', isNotAuthenticated, async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    if (!username || !email || !password || !confirmPassword) {
      req.flash('error', 'กรุณากรอกข้อมูลให้ครบถ้วน');
      return res.redirect('/auth/signup');
    }

    if (password !== confirmPassword) {
      req.flash('error', 'รหัสผ่านไม่ตรงกัน');
      return res.redirect('/auth/signup');
    }

    if (password.length < 6) {
      req.flash('error', 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return res.redirect('/auth/signup');
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      req.flash('error', 'อีเมลหรือชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว');
      return res.redirect('/auth/signup');
    }

    const user = new User({ username, email, password });
    await user.save();

    req.session.userId = user._id;
    req.session.username = user.username;
    req.session.role = user.role;
    req.session.balance = user.balance;

    req.flash('success', 'สมัครสมาชิกสำเร็จ');
    res.redirect('/');
  } catch (err) {
    console.error(err);
    req.flash('error', 'เกิดข้อผิดพลาด กรุณาลองอีกครั้ง');
    res.redirect('/auth/signup');
  }
});

router.post('/signin', isNotAuthenticated, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      req.flash('error', 'กรุณากรอกข้อมูลให้ครบถ้วน');
      return res.redirect('/auth/signin');
    }

    const user = await User.findOne({ email });
    if (!user) {
      req.flash('error', 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      return res.redirect('/auth/signin');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      req.flash('error', 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      return res.redirect('/auth/signin');
    }

    req.session.userId = user._id;
    req.session.username = user.username;
    req.session.role = user.role;
    req.session.balance = user.balance;

    req.flash('success', 'เข้าสู่ระบบสำเร็จ');
    res.redirect('/');
  } catch (err) {
    console.error(err);
    req.flash('error', 'เกิดข้อผิดพลาด กรุณาลองอีกครั้ง');
    res.redirect('/auth/signin');
  }
});

router.get('/logout', isAuthenticated, (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;
