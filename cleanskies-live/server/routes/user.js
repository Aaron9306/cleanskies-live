const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   PUT /api/user/profile
// @desc    Update user profile and health data
// @access  Private
router.put('/profile', auth, [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('healthData.age').optional().isInt({ min: 0, max: 120 }).withMessage('Age must be between 0 and 120'),
  body('healthData.conditions').optional().isArray().withMessage('Conditions must be an array'),
  body('healthData.sensitivity').optional().isIn(['low', 'medium', 'high']).withMessage('Sensitivity must be low, medium, or high'),
  body('preferences.alertsEnabled').optional().isBoolean().withMessage('Alerts enabled must be boolean'),
  body('preferences.alertThreshold').optional().isIn(['moderate', 'unhealthy_sensitive', 'unhealthy', 'very_unhealthy', 'hazardous']).withMessage('Invalid alert threshold'),
  body('preferences.location.latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('preferences.location.longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const updates = req.body;
    const allowedUpdates = ['name', 'healthData', 'preferences'];
    
    // Filter out invalid fields
    const filteredUpdates = {};
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: filteredUpdates },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        healthData: user.healthData,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

// @route   DELETE /api/user/account
// @desc    Delete user account
// @access  Private
router.delete('/account', auth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Server error deleting account' });
  }
});

module.exports = router;
