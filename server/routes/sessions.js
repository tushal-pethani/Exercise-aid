const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Session = require('../models/Session');
const User = require('../models/User');

// @route   POST api/sessions
// @desc    Create a new session
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { patientId, notes } = req.body;
    
    // If user is a patient, they can only create sessions with their ID
    if (req.user.role === 'patient' && patientId !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to create session for another patient' });
    }
    
    // Verify patient exists
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Create session
    const newSession = new Session({
      patient: patientId,
      physiotherapist: req.user.role === 'physiotherapist' ? req.user.id : req.body.physiotherapistId,
      notes: notes || ''
    });
    
    const session = await newSession.save();
    
    res.status(201).json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/sessions
// @desc    Get all sessions for the current user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    
    // If user is patient, get sessions where they are the patient
    if (req.user.role === 'patient') {
      query.patient = req.user.id;
    }
    
    // If user is physiotherapist, get sessions where they are the physiotherapist
    if (req.user.role === 'physiotherapist') {
      query.physiotherapist = req.user.id;
    }
    
    const sessions = await Session.find(query)
      .populate('patient', 'username email age')
      .populate('physiotherapist', 'username email')
      .sort({ date: -1 });
    
    res.json(sessions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH api/sessions/:id
// @desc    Update session data
// @access  Private
router.patch('/:id', auth, async (req, res) => {
  try {
    const { exerciseData, duration, notes, calibrationPoints } = req.body;
    
    // Find session
    const session = await Session.findById(req.params.id);
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    // Check authorization
    if (
      (req.user.role === 'patient' && session.patient.toString() !== req.user.id) ||
      (req.user.role === 'physiotherapist' && session.physiotherapist.toString() !== req.user.id)
    ) {
      return res.status(401).json({ message: 'Not authorized to update this session' });
    }
    
    // Update fields if provided
    if (exerciseData) session.exerciseData = exerciseData;
    if (duration) session.duration = duration;
    if (notes) session.notes = notes;
    if (calibrationPoints) session.calibrationPoints = calibrationPoints;
    
    const updatedSession = await session.save();
    
    res.json(updatedSession);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/sessions/:id
// @desc    Get session by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('patient', 'username email age')
      .populate('physiotherapist', 'username email');
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    // Check authorization
    if (
      (req.user.role === 'patient' && session.patient._id.toString() !== req.user.id) ||
      (req.user.role === 'physiotherapist' && session.physiotherapist._id.toString() !== req.user.id)
    ) {
      return res.status(401).json({ message: 'Not authorized to view this session' });
    }
    
    res.json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 