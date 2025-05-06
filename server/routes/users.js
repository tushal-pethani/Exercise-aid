const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// @route   GET api/users
// @desc    Get all users of a specific role (for connecting)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { role } = req.query;
    
    let query = {};
    
    // If role is specified, find users of that role
    if (role && ['client', 'physio', 'patient', 'physiotherapist'].includes(role.toLowerCase())) {
      // Match various forms of client/physio
      if (['physio', 'physiotherapist'].includes(role.toLowerCase())) {
        query.role = { $in: ['physio', 'Physio', 'physiotherapist', 'PHYSIO'] };
      } else {
        query.role = { $in: ['client', 'Client', 'patient', 'CLIENT'] };
      }
    }
    
    // Exclude current user
    query._id = { $ne: req.user.id };
    
    const users = await User.find(query)
      .select('-password')
      .sort({ username: 1 });
    
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// === Handle the /search path explicitly ===

// @route   GET api/users/search
// @desc    Search users by username and role (special handler to avoid ID parameter confusion)
// @access  Private
router.get('/search', auth, async (req, res) => {
  try {
    console.log('Search path in users.js called with:', req.query);
    const { query, role } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    let roleFilter = {};
    
    // If role is specified, filter by role variations
    if (role) {
      if (['physio', 'physiotherapist'].includes(role.toLowerCase())) {
        roleFilter = { role: { $in: ['physio', 'Physio', 'physiotherapist', 'PHYSIO'] } };
      } else if (['client', 'patient'].includes(role.toLowerCase())) {
        roleFilter = { role: { $in: ['client', 'Client', 'patient', 'CLIENT'] } };
      }
    }
    
    // Build search query
    let searchQuery = {
      username: { $regex: query, $options: 'i' },
      _id: { $ne: req.user.id },
      ...roleFilter
    };
    
    console.log('Executing search query:', searchQuery);
    
    const users = await User.find(searchQuery)
      .select('-password')
      .sort({ username: 1 })
      .limit(10); // Limit results to prevent large responses
    
    console.log(`Found ${users.length} users matching query.`);
    res.json(users);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ message: 'Server error', details: err.message });
  }
});

// @route   GET api/users/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/users/connections
// @desc    Get all connections for the current user
// @access  Private
router.get('/connections', auth, async (req, res) => {
  try {
    // Find user with connections populated
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('connections', '-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user.connections || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// === ID parameter route must be last ===

// @route   GET api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  // Special case for "search" string to avoid the error
  if (req.params.id === 'search') {
    return res.status(404).json({ 
      message: `Invalid route. Please use /api/search/users instead.` 
    });
  }
  
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 