const mongoose = require('mongoose');

// User Schema
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

// Product Schema
const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  image: { type: String },
});

// Order Schema
const OrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  status: { type: String, default: 'Pending', enum: ['Pending', 'Accepted', 'Rejected', 'Cancelled'] },
});

// Category Schema
const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
});

module.exports = {
  User: mongoose.model('User', UserSchema),
  Product: mongoose.model('Product', ProductSchema),
  Order: mongoose.model('Order', OrderSchema),
  Category: mongoose.model('Category', CategorySchema),
};