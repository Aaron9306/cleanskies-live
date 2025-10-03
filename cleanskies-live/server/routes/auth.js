const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const isDatabaseEnabled = String(process.env.USE_DB || 'false') !== 'false';
const User = isDatabaseEnabled ? require('../models/User') : null;

const router = express.Router();

// Template user for stateless mode
const templateUser = {
  id: 'temp-user',
  name: 'Guest',
  email: 'guest@example.com',
  healthData: {
    sensitivity: 'medium',
    conditions: []
  },
  preferences: {
    alertsEnabled: true,
    alertThreshold: 'unhealthy_sensitive'
  },
  lastLogin: new Date()
};

// Generate JWT token
const generateToken = (args) => {
  if (!isDatabaseEnabled) {
    const user = args?.user || templateUser;
    return jwt.sign({ user }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    });
  }
  const userId = args?.userId;
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post('/signup', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    if (!isDatabaseEnabled) {
      const token = generateToken({ user: { ...templateUser, name: req.body.name || templateUser.name, email: req.body.email || templateUser.email } });
      return res.status(201).json({
        message: 'Temp signup successful (stateless)',
        token,
        user: { ...templateUser, name: req.body.name || templateUser.name, email: req.body.email || templateUser.email }
      });
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create new user
    const user = new User({ name, email, password });
    await user.save();

    // Generate token
    const token = generateToken({ userId: user._id });

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        healthData: user.healthData,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    if (!isDatabaseEnabled) {
      const token = generateToken({ user: { ...templateUser, email: req.body.email || templateUser.email } });
      return res.json({
        message: 'Temp login successful (stateless)',
        token,
        user: { ...templateUser, email: req.body.email || templateUser.email }
      });
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken({ userId: user._id });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        healthData: user.healthData,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user.id || req.user._id,
        name: req.user.name,
        email: req.user.email,
        healthData: req.user.healthData,
        preferences: req.user.preferences,
        lastLogin: req.user.lastLogin
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/temp-login
// @desc    Stateless login that returns a template user JWT (no DB required)
// @access  Public
router.post('/temp-login', async (req, res) => {
  try {
    const overridden = {
      name: req.body?.name || templateUser.name,
      email: req.body?.email || templateUser.email,
      healthData: req.body?.healthData || templateUser.healthData,
      preferences: req.body?.preferences || templateUser.preferences,
    };
    const user = { ...templateUser, ...overridden };
    const token = generateToken({ user });
    res.json({ message: 'Temp login successful', token, user });
  } catch (error) {
    console.error('Temp login error:', error);
    res.status(500).json({ message: 'Server error during temp login' });
  }
});

// @route   GET /api/auth/temp-token
// @desc    Get a template user JWT without a request body
// @access  Public
router.get('/temp-token', async (req, res) => {
  try {
    const user = templateUser;
    const token = generateToken({ user });
    res.json({ message: 'Temp token issued', token, user });
  } catch (error) {
    console.error('Temp token error:', error);
    res.status(500).json({ message: 'Server error during temp token issuance' });
  }
});

module.exports = router;
