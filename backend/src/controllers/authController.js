const bcrypt = require('bcryptjs');
const User = require('../models/User'); // Import the Mongoose model
const generateToken = require('../utils/generateToken');

// POST /api/auth/register
async function register(req, res, next) {
  try {
    const { name, email, password, role, department, mentorId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email and password are required.' });
    }

    const allowedRoles = ['admin', 'mentor', 'intern'];
    const finalRole = allowedRoles.includes(role) ? role : 'intern';

    // Check if user exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    // Create user (Note: password hashing is handled by the pre-save hook in User model)
    const user = await User.create({
      name,
      email,
      password, // Mongoose model will hash this
      role: finalRole,
      department,
      mentorId
    });

    const token = generateToken(user);

    // Return user without password
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department
    };

    res.status(201).json({ user: userResponse, token });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required.' });
    }

    // Find user and include password field explicitly since we hide it by default
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = generateToken(user);
    
    res.json({ 
      user: { id: user._id, name: user.name, email: user.email, role: user.role }, 
      token 
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me
async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, getMe };