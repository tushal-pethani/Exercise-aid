const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Message = require('../models/Message');
const User = require('../models/User');
const mongoose = require('mongoose');

// @route   POST api/messages
// @desc    Send a new message
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { recipient, content } = req.body;

    // Validate recipient
    if (!mongoose.Types.ObjectId.isValid(recipient)) {
      return res.status(400).json({ message: 'Invalid recipient ID' });
    }

    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Message content is required' });
    }

    // Check if recipient exists
    const recipientUser = await User.findById(recipient);
    if (!recipientUser) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    // Create and save the message
    const newMessage = new Message({
      sender: req.user.id,
      recipient,
      content: content.trim()
    });

    await newMessage.save();

    // Return the saved message with populated sender info
    const savedMessage = await Message.findById(newMessage._id)
      .populate('sender', 'username profilePicture')
      .populate('recipient', 'username profilePicture');

    res.json(savedMessage);
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/messages/conversation/:userId
// @desc    Get all messages between the current user and another user
// @access  Private
router.get('/conversation/:userId', auth, async (req, res) => {
  try {
    const otherUserId = req.params.userId;

    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Find all messages between these two users
    const messages = await Message.find({
      $or: [
        { sender: req.user.id, recipient: otherUserId },
        { sender: otherUserId, recipient: req.user.id }
      ]
    })
      .sort({ createdAt: 1 })
      .populate('sender', 'username profilePicture')
      .populate('recipient', 'username profilePicture');

    // Mark all unread messages as read
    await Message.updateMany(
      { sender: otherUserId, recipient: req.user.id, read: false },
      { read: true }
    );

    res.json(messages);
  } catch (err) {
    console.error('Error fetching conversation:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/messages/unread
// @desc    Get count of unread messages for current user
// @access  Private
router.get('/unread', auth, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      recipient: req.user.id,
      read: false
    });

    res.json({ count });
  } catch (err) {
    console.error('Error counting unread messages:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 