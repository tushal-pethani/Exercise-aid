const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// @route   GET api/search/users
// @desc    Search users by username and role
// @access  Private
router.get('/users', auth, async (req, res) => {
  try {
    console.log('Search users route called with query:', req.query);
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
    
    console.log('Executing search with query:', searchQuery);
    
    const users = await User.find(searchQuery)
      .select('-password')
      .sort({ username: 1 })
      .limit(10); // Limit results to prevent large responses
    
    console.log(`Found ${users.length} matching users`);
    res.json(users);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ message: 'Server error', details: err.message });
  }
});

module.exports = router; 