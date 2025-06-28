const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost/murugan_supermarket', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Models
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
});
const ProductSchema = new mongoose.Schema({
  name: String,
  price: Number,
  category: String,
  image: String,
});
const OrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  status: { type: String, default: 'Pending' },
});
const CategorySchema = new mongoose.Schema({
  name: String,
});

const User = mongoose.model('User', UserSchema);
const Product = mongoose.model('Product', ProductSchema);
const Order = mongoose.model('Order', OrderSchema);
const Category = mongoose.model('Category', CategorySchema);

// Middleware for Authentication
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    const decoded = jwt.verify(token, 'secret');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Routes
// Auth Routes
app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'User created' });
  } catch (err) {
    res.status(400).json({ message: 'Signup failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // Admin check
    if (email === 'admin@murugansskarur.com' && password !== 'mssk@online25') {
      return res.status(400).json({ message: 'Invalid admin credentials' });
    }

    const token = jwt.sign({ id: user._id, email: user.email }, 'secret', { expiresIn: '1h' });
    res.json({ token, user: { _id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  res.json(user);
});

// Product Routes
app.get('/api/products', async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

app.post('/api/products', authMiddleware, async (req, res) => {
  if (req.user.email !== 'admin@murugansskarur.com') return res.status(403).json({ message: 'Admin only' });
  const product = new Product(req.body);
  await product.save();
  res.json(product);
});

app.delete('/api/products/:id', authMiddleware, async (req, res) => {
  if (req.user.email !== 'admin@murugansskarur.com') return res.status(403).json({ message: 'Admin only' });
  await Product.findByIdAndDelete(req.params.id);
  res.json({ message: 'Product deleted' });
});

// Order Routes
app.get('/api/orders', authMiddleware, async (req, res) => {
  if (req.user.email !== 'admin@murugansskarur.com') return res.status(403).json({ message: 'Admin only' });
  const orders = await Order.find().populate('product').populate('userId');
  res.json(orders);
});

app.post('/api/orders', authMiddleware, async (req, res) => {
  const order = new Order({ ...req.body, userId: req.user.id });
  await order.save();
  res.json(order);
});

app.put('/api/orders/:id', authMiddleware, async (req, res) => {
  if (req.user.email !== 'admin@murugansskarur.com') return res.status(403).json({ message: 'Admin only' });
  const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(order);
});

// Category Routes
app.get('/api/categories', async (req, res) => {
  const categories = await Category.find();
  res.json(categories);
});

app.post('/api/categories', authMiddleware, async (req, res) => {
  if (req.user.email !== 'admin@murugansskarur.com') return res.status(403).json({ message: 'Admin only' });
  const category = new Category(req.body);
  await category.save();
  res.json(category);
});

// Initialize default categories
const initCategories = async () => {
  const defaultCategories = [
    'Groceries', 'Household', 'Daily Needs', 'Essentials', 'Women Special', 'Men Special'
  ];
  const existing = await Category.find();
  for (const cat of defaultCategories) {
    if (!existing.find(c => c.name === cat)) {
      await new Category({ name: cat }).save();
    }
  }
};
initCategories();

// Initialize admin user
const initAdmin = async () => {
  const adminEmail = 'admin@murugansskarur.com';
  const adminExists = await User.findOne({ email: adminEmail });
  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('mssk@online25', 10);
    await new User({
      name: 'Admin',
      email: adminEmail,
      password: hashedPassword,
    }).save();
  }
};
initAdmin();

app.listen(5000, () => console.log('Server running on port 5000'));