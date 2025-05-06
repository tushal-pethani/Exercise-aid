const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ExerciseAssignment = require('../models/ExerciseAssignment');
const User = require('../models/User');
const mongoose = require('mongoose');

// @route   POST api/assignments
// @desc    Create a new exercise assignment
// @access  Private (Physio only)
router.post('/', auth, async (req, res) => {
  try {
    console.log('Creating new assignment, body:', JSON.stringify(req.body));
    console.log('User:', req.user.id, 'Role:', req.user.role);
    
    // Check if user is a physiotherapist
    if (req.user.role.toLowerCase() !== 'physio') {
      console.log('Access denied - incorrect role:', req.user.role);
      return res.status(403).json({ message: 'Access denied. Only physiotherapists can assign exercises.' });
    }

    const {
      clientId,
      exerciseType,
      bodyPart,
      targetAngle,
      sets,
      reps,
      restTime,
      notes
    } = req.body;

    console.log('Validating client:', clientId);
    
    // Validate fields
    if (!clientId || !mongoose.Types.ObjectId.isValid(clientId)) {
      console.log('Invalid clientId format:', clientId);
      return res.status(400).json({ message: 'Invalid client ID format' });
    }
    
    // Basic field validation
    if (!exerciseType || !bodyPart || !targetAngle || !sets || !reps || !restTime) {
      console.log('Missing required fields');
      return res.status(400).json({ message: 'All fields are required', 
        required: ['clientId', 'exerciseType', 'bodyPart', 'targetAngle', 'sets', 'reps', 'restTime'] 
      });
    }

    // Verify client exists
    const client = await User.findById(clientId);
    if (!client) {
      console.log('Client not found with ID:', clientId);
      return res.status(404).json({ message: 'Client not found' });
    }

    // Check if client's role is actually 'client'
    if (client.role.toLowerCase() !== 'client') {
      console.log('Selected user is not a client:', client.role);
      return res.status(400).json({ message: 'Selected user is not a client' });
    }

    console.log('Creating assignment object');
    
    // Create new assignment
    const newAssignment = new ExerciseAssignment({
      physioId: req.user.id,
      clientId,
      exerciseType,
      bodyPart,
      targetAngle: Number(targetAngle),
      sets: Number(sets),
      reps: Number(reps),
      restTime: Number(restTime),
      notes: notes || '',
      status: 'pending'
    });

    console.log('Saving assignment to database');
    const assignment = await newAssignment.save();
    console.log('Assignment saved successfully:', assignment._id);
    
    res.status(201).json({
      success: true,
      assignment
    });
  } catch (err) {
    console.error('Error creating assignment:', err);
    
    // Handle mongoose validation errors specifically
    if (err.name === 'ValidationError') {
      const validationErrors = {};
      
      // Extract validation error details
      for (const field in err.errors) {
        validationErrors[field] = err.errors[field].message;
      }
      
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: validationErrors 
      });
    }
    
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route   GET api/assignments
// @desc    Get all assignments (physio sees assignments they created, clients see assignments assigned to them)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let assignments;
    
    if (req.user.role.toLowerCase() === 'physio') {
      // Physios see assignments they created
      assignments = await ExerciseAssignment.find({ physioId: req.user.id })
        .populate('clientId', 'username email profilePicture')
        .sort({ createdAt: -1 });
    } else {
      // Clients see assignments assigned to them
      assignments = await ExerciseAssignment.find({ clientId: req.user.id })
        .populate('physioId', 'username email profilePicture')
        .sort({ createdAt: -1 });
    }
    
    res.json(assignments);
  } catch (err) {
    console.error('Error fetching assignments:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route   GET api/assignments/client/:clientId
// @desc    Get all assignments for a specific client (physio only)
// @access  Private (Physio only)
router.get('/client/:clientId', auth, async (req, res) => {
  try {
    // Log request details
    console.log(`Fetching assignments for client ID: ${req.params.clientId} by physio ID: ${req.user.id}`);
    console.log('User role:', req.user.role);
    
    // Check if user is a physiotherapist
    if (req.user.role.toLowerCase() !== 'physio') {
      console.log('Access denied: User is not a physio', req.user.role);
      return res.status(403).json({ message: 'Access denied. Only physiotherapists can view client assignments.' });
    }

    // Validate clientId format
    if (!req.params.clientId || !mongoose.Types.ObjectId.isValid(req.params.clientId)) {
      console.log('Invalid client ID format:', req.params.clientId);
      return res.status(400).json({ message: 'Invalid client ID format' });
    }

    // Check if client exists
    try {
      const clientExists = await User.findById(req.params.clientId);
      if (!clientExists) {
        console.log(`Client with ID ${req.params.clientId} not found`);
        return res.status(404).json({ message: 'Client not found' });
      }
      
      console.log('Client found:', clientExists.username);
    } catch (clientErr) {
      console.log('Error finding client:', clientErr.message);
      // If it's an invalid ID format, return 400
      if (clientErr.name === 'CastError') {
        return res.status(400).json({ message: 'Invalid client ID format' });
      }
      throw clientErr; // Re-throw to be caught by outer catch
    }

    console.log('Fetching assignments with query:', { 
      physioId: req.user.id,
      clientId: req.params.clientId
    });

    const assignments = await ExerciseAssignment.find({ 
      physioId: req.user.id,
      clientId: req.params.clientId
    })
    .sort({ createdAt: -1 });
    
    console.log(`Found ${assignments.length} assignments for client ${req.params.clientId}`);
    
    // Always return an array, even if empty
    res.json(assignments);
  } catch (err) {
    console.error('Error fetching client assignments:', err);
    res.status(500).json({ message: 'Server error', error: err.message, stack: err.stack });
  }
});

// @route   PATCH api/assignments/:id
// @desc    Update assignment status
// @access  Private
router.patch('/:id', auth, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['pending', 'accepted', 'completed', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Valid status required' });
    }
    
    const assignment = await ExerciseAssignment.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    // Verify user is authorized (either the client or the physio)
    const isClient = assignment.clientId.toString() === req.user.id;
    const isPhysio = assignment.physioId.toString() === req.user.id;
    
    if (!isClient && !isPhysio) {
      return res.status(403).json({ message: 'Not authorized to update this assignment' });
    }
    
    // Client can only accept, reject or complete
    if (isClient && !isPhysio) {
      if (!['accepted', 'rejected', 'completed'].includes(status)) {
        return res.status(400).json({ message: 'Clients can only accept, reject or complete assignments' });
      }
    }
    
    // Set completedAt if status is changing to completed
    if (status === 'completed' && assignment.status !== 'completed') {
      assignment.completedAt = Date.now();
    }
    
    assignment.status = status;
    assignment.updatedAt = Date.now();
    
    const updatedAssignment = await assignment.save();
    
    res.json(updatedAssignment);
  } catch (err) {
    console.error('Error updating assignment:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route   DELETE api/assignments/:id
// @desc    Delete an assignment (physio only)
// @access  Private (Physio only)
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if user is a physiotherapist
    if (req.user.role.toLowerCase() !== 'physio') {
      return res.status(403).json({ message: 'Access denied. Only physiotherapists can delete assignments.' });
    }

    const assignment = await ExerciseAssignment.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    // Check if this physiotherapist created the assignment
    if (assignment.physioId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this assignment' });
    }
    
    await ExerciseAssignment.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Assignment deleted successfully' });
  } catch (err) {
    console.error('Error deleting assignment:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router; 