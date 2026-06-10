require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const seed = async () => {
  await connectDB();

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
    console.log('สร้าง Admin: admin@gamecodeshop.com / admin123');
  }

  const products = [
    {
      name: 'Activation Code เข้า FiveM',
      price: 15,
      stock: 100,
      category: 'FiveM',
      codes: Array.from({ length: 100 }, (_, i) => `FIVEM-ACT-${String(i + 1).padStart(6, '0')}`)
    },
    {
      name: 'บัญชี Rockstar เปล่าๆ สร้างใหม่ มือเดียว',
      price: 10,
      stock: 50,
      category: 'Rockstar',
      codes: Array.from({ length: 50 }, (_, i) => `RSTAR-EMP-${String(i + 1).padStart(6, '0')}`)
    },
    {
      name: 'บัญชี Steam เปล่าๆ สร้างใหม่ มือเดียว',
      price: 10,
      stock: 30,
      category: 'Steam',
      codes: Array.from({ length: 30 }, (_, i) => `STEAM-EMP-${String(i + 1).padStart(6, '0')}`)
    },
    {
      name: 'Nitro Discord 1เดือน 2บูสต์',
      price: 15,
      stock: 20,
      category: 'Discord',
      codes: Array.from({ length: 20 }, (_, i) => `DISCORD-N1-${String(i + 1).padStart(6, '0')}`)
    },
    {
      name: 'Nitro Discord 3เดือน 2บูสต์',
      price: 50,
      stock: 10,
      category: 'Discord',
      codes: Array.from({ length: 10 }, (_, i) => `DISCORD-N3-${String(i + 1).padStart(6, '0')}`)
    },
    {
      name: 'บัญชี Roblox บัญชีใหม่',
      price: 5,
      stock: 50,
      category: 'Roblox',
      codes: Array.from({ length: 50 }, (_, i) => `ROBLOX-NEW-${String(i + 1).padStart(6, '0')}`)
    }
  ];

  for (const p of products) {
    const exists = await Product.findOne({ name: p.name });
    if (!exists) {
      p.sold = Math.floor(Math.random() * 20);
      p.image = 'default.svg';
      p.description = `รหัส ${p.name} ราคาถูกสุดๆ ส่งรหัสอัตโนมัติ`;
      await Product.create(p);
      console.log(`เพิ่มสินค้า: ${p.name}`);
    }
  }

  console.log('Seed ข้อมูลเรียบร้อย!');
  process.exit(0);
};

seed();
