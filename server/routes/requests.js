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
    .populate('sender', 'username email role medicalConditions specialties profilePicture')
    .populate('recipient', 'username email role medicalConditions specialties profilePicture')
    .sort({ createdAt: -1 });
    
    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/requests/debug/:id
// @desc    Debug endpoint to examine a specific request
// @access  Private
router.get('/debug/:id', auth, async (req, res) => {
  try {
    console.log('Debug request received for ID:', req.params.id);
    console.log('User making debug request:', req.user.id);
    
    // Find request with all fields
    const request = await Request.findById(req.params.id)
      .populate('sender', 'username email role')
      .populate('recipient', 'username email role');
    
    if (!request) {
      console.log('Debug: Request not found with ID:', req.params.id);
      return res.status(404).json({ message: 'Request not found' });
    }
    
    // For debugging, include whether this user is authorized
    const isSender = request.sender._id.toString() === req.user.id;
    const isRecipient = request.recipient._id.toString() === req.user.id;
    
    const debugInfo = {
      request,
      requestStringified: JSON.stringify(request),
      authorization: {
        userId: req.user.id,
        isSender,
        isRecipient,
        senderId: request.sender._id.toString(),
        recipientId: request.recipient._id.toString(),
        isAuthorized: isSender || isRecipient
      }
    };
    
    res.json(debugInfo);
  } catch (err) {
    console.error('Error in debug endpoint:', err);
    res.status(500).json({ message: 'Debug error', error: err.message });
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
    
    // If request is accepted, add users to each other's connections
    if (status === 'accepted') {
      // Add sender to recipient's connections
      await User.findByIdAndUpdate(
        req.user.id,
        { $addToSet: { connections: request.sender } }
      );
      
      // Add recipient to sender's connections
      await User.findByIdAndUpdate(
        request.sender,
        { $addToSet: { connections: req.user.id } }
      );
    }
    
    const updatedRequest = await request.save();
    
    res.json(updatedRequest);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE api/requests/:id
// @desc    Cancel a pending connection request
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  console.log('=== DELETE ROUTE HANDLER EXECUTING ===');
  console.log('Request ID param:', req.params.id);
  console.log('User from token:', req.user);
  
  try {
    console.log('DELETE request received for ID:', req.params.id);
    console.log('User making request:', req.user.id);
    
    // Find request
    const request = await Request.findById(req.params.id);
    
    if (!request) {
      console.log('Request not found with ID:', req.params.id);
      return res.status(404).json({ message: 'Request not found' });
    }
    
    console.log('Request found:', JSON.stringify(request));
    
    // Ensure consistent string format for all IDs
    const senderIdString = request.sender.toString();
    const recipientIdString = request.recipient.toString();
    const userIdString = req.user.id.toString();
    
    console.log('Sender ID as string:', senderIdString);
    console.log('Recipient ID as string:', recipientIdString);
    console.log('User ID as string:', userIdString);
    
    // Check if user is sender or recipient
    const isAuthorized = senderIdString === userIdString || recipientIdString === userIdString;
    console.log('Is authorized?', isAuthorized);
    
    if (!isAuthorized) {
      console.log('Authorization failed. User is neither sender nor recipient');
      return res.status(401).json({ message: 'User not authorized to cancel this request' });
    }
    
    // Make sure the request is still pending
    if (request.status !== 'pending') {
      console.log('Request is not pending, status:', request.status);
      return res.status(400).json({ message: 'Only pending requests can be cancelled' });
    }
    
    // Delete the request
    console.log('Attempting to delete request with ID:', req.params.id);
    try {
      const deleteResult = await Request.deleteOne({ _id: req.params.id });
      console.log('Delete operation result:', JSON.stringify(deleteResult));
      
      if (deleteResult.deletedCount === 1) {
        console.log('Request successfully deleted');
        res.json({ message: 'Request cancelled successfully' });
      } else {
        console.log('Delete operation did not remove any documents');
        res.status(500).json({ message: 'Failed to delete request', details: deleteResult });
      }
    } catch (deleteErr) {
      console.error('Error during delete operation:', deleteErr);
      throw deleteErr; // Re-throw to be caught by outer catch block
    }
  } catch (err) {
    console.error('Error in DELETE /api/requests/:id:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router; 