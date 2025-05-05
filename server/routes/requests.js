const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Request = require('../models/Request');
const User = require('../models/User');

// @route   POST api/requests
// @desc    Create a new connection request
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { recipientId } = req.body;
    
    // Validate input
    if (!recipientId) {
      return res.status(400).json({ message: 'Recipient ID is required' });
    }
    
    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }
    
    // Check if sender and recipient are different users
    if (req.user.id === recipientId) {
      return res.status(400).json({ message: 'Cannot send request to yourself' });
    }
    
    // Check if there's already a pending request
    const existingRequest = await Request.findOne({
      $or: [
        { sender: req.user.id, recipient: recipientId, status: 'pending' },
        { sender: recipientId, recipient: req.user.id, status: 'pending' }
      ]
    });
    
    if (existingRequest) {
      return res.status(400).json({ message: 'A pending request already exists' });
    }
    
    // Create new request
    const newRequest = new Request({
      sender: req.user.id,
      recipient: recipientId,
      status: 'pending'
    });
    
    const request = await newRequest.save();
    
    res.json(request);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/requests
// @desc    Get all requests for the current user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    // Find all requests where the user is sender or recipient
    const requests = await Request.find({
      $or: [
        { sender: req.user.id },
        { recipient: req.user.id }
      ]
    })
    .populate('sender', 'username email role')
    .populate('recipient', 'username email role')
    .sort({ createdAt: -1 });
    
    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH api/requests/:id
// @desc    Update request status (accept or decline)
// @access  Private
router.patch('/:id', auth, async (req, res) => {
  try {
    const { status } = req.body;
    
    // Validate input
    if (!status || !['accepted', 'declined'].includes(status)) {
      return res.status(400).json({ message: 'Valid status (accepted/declined) is required' });
    }
    
    // Find request
    const request = await Request.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    // Ensure user is the recipient of the request
    if (request.recipient.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized to update this request' });
    }
    
    // Update request
    request.status = status;
    request.updatedAt = Date.now();
    
    const updatedRequest = await request.save();
    
    res.json(updatedRequest);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 