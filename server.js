require('dotenv').config();
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
const connectDB = require('./config/db');
const { getSettings } = require('./config/settings');

const app = express();

connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.set('trust proxy', 1);

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
}));

app.use(flash());

app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.user = req.session.userId ? {
    id: req.session.userId,
    username: req.session.username,
    role: req.session.role,
    balance: req.session.balance
  } : null;
  next();
});

app.use(async (req, res, next) => {
  try {
    res.locals.settings = await getSettings();
  } catch {
    res.locals.settings = {};
  }
  next();
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/products', require('./routes/products'));
app.use('/cart', require('./routes/cart'));
app.use('/topup', require('./routes/topup'));
app.use('/admin', require('./routes/admin'));

const User = require('./models/User');
const Product = require('./models/Product');

const seedInitialData = async () => {
  try {
    const adminExists = await User.findOne({ email: 'admin@gamecodeshop.com' });
    if (!adminExists) {
      const admin = new User({
        username: 'admin',
        email: 'admin@gamecodeshop.com',
        password: 'admin123',
        role: 'admin',
        balance: 10000
      });
      await admin.save();
      console.log('Created admin account');
    }

    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      const initialProducts = [
        { name: 'Activation Code เข้า FiveM', price: 15, stock: 100, category: 'FiveM', codes: Array.from({ length: 100 }, (_, i) => `FIVEM-ACT-${String(i + 1).padStart(6, '0')}`) },
        { name: 'บัญชี Rockstar เปล่าๆ', price: 10, stock: 50, category: 'Rockstar', codes: Array.from({ length: 50 }, (_, i) => `RSTAR-EMP-${String(i + 1).padStart(6, '0')}`) },
        { name: 'บัญชี Steam เปล่าๆ', price: 10, stock: 30, category: 'Steam', codes: Array.from({ length: 30 }, (_, i) => `STEAM-EMP-${String(i + 1).padStart(6, '0')}`) },
        { name: 'Nitro Discord 1เดือน 2บูสต์', price: 15, stock: 20, category: 'Discord', codes: Array.from({ length: 20 }, (_, i) => `DISCORD-N1-${String(i + 1).padStart(6, '0')}`) },
        { name: 'Nitro Discord 3เดือน 2บูสต์', price: 50, stock: 10, category: 'Discord', codes: Array.from({ length: 10 }, (_, i) => `DISCORD-N3-${String(i + 1).padStart(6, '0')}`) },
        { name: 'บัญชี Roblox บัญชีใหม่', price: 5, stock: 50, category: 'Roblox', codes: Array.from({ length: 50 }, (_, i) => `ROBLOX-NEW-${String(i + 1).padStart(6, '0')}`) }
      ];
      for (const p of initialProducts) {
        p.sold = Math.floor(Math.random() * 20);
        p.image = 'default.svg';
        p.description = `รหัส ${p.name} ราคาถูกสุดๆ ส่งรหัสอัตโนมัติ`;
        await Product.create(p);
      }
      console.log('Created initial products');
    }
  } catch (err) {
    console.error('Seed error:', err.message);
  }
};

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await seedInitialData();
});
