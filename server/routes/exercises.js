const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Exercise = require('../models/Exercise');
const User = require('../models/User');

// @route   POST api/exercises
// @desc    Create a new exercise entry
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const {
      exerciseType,
      bodyPart,
      sets,
      reps,
      totalReps,
      perfectReps,
      goodReps,
      badReps,
      timeTaken,
      accuracy,
      targetAngle,
    } = req.body;

    // Get user's username
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create new exercise
    const newExercise = new Exercise({
      userId: req.user.id,
      username: user.username,
      exerciseType,
      bodyPart,
      sets,
      reps,
      totalReps,
      perfectReps,
      goodReps,
      badReps,
      timeTaken,
      accuracy,
      targetAngle,
    });

    const exercise = await newExercise.save();
    res.status(201).json(exercise);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/exercises
// @desc    Get current user's exercises
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const exercises = await Exercise.find({ userId: req.user.id })
      .sort({ date: -1 });
    
    // Always return an array (even if empty)
    res.json(exercises);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/exercises/recent
// @desc    Get recent exercises for current user (limit 5)
// @access  Private
router.get('/recent', auth, async (req, res) => {
  try {
    const exercises = await Exercise.find({ userId: req.user.id })
      .sort({ date: -1 })
      .limit(5);
    
    // Always return an array (even if empty)
    res.json(exercises);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/exercises/user/:username
// @desc    Get exercises by username (physio access only)
// @access  Private
router.get('/user/:username', auth, async (req, res) => {
  try {
    // Only physios can see other users' exercises
    if (req.user.role !== 'physio') {
      return res.status(403).json({ message: 'Access denied. Physio permission required.' });
    }

    // Find user by username
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get exercises
    const exercises = await Exercise.find({ userId: user._id })
      .sort({ date: -1 });
    
    // Always return an array (even if empty)
    res.json(exercises);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE api/exercises/:id
// @desc    Delete an exercise
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    
    if (!exercise) {
      return res.status(404).json({ message: 'Exercise not found' });
    }
    
    // Check if user owns the exercise
    if (exercise.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }
    
    await Exercise.deleteOne({ _id: req.params.id });
    res.json({ message: 'Exercise deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/exercises/stats
// @desc    Get exercise statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const exercises = await Exercise.find({ userId: req.user.id });
    
    if (exercises.length === 0) {
      return res.json({
        totalSessions: 0,
        totalTime: 0,
        averageAccuracy: 0,
        bodyPartDistribution: {},
        exerciseTypeDistribution: {},
      });
    }
    
    // Calculate statistics
    const totalSessions = exercises.length;
    const totalTime = exercises.reduce((sum, exercise) => sum + exercise.timeTaken, 0);
    const totalAccuracy = exercises.reduce((sum, exercise) => sum + exercise.accuracy, 0);
    const averageAccuracy = totalAccuracy / totalSessions;
    
    // Calculate body part distribution
    const bodyPartDistribution = exercises.reduce((acc, exercise) => {
      acc[exercise.bodyPart] = (acc[exercise.bodyPart] || 0) + 1;
      return acc;
    }, {});
    
    // Calculate exercise type distribution
    const exerciseTypeDistribution = exercises.reduce((acc, exercise) => {
      acc[exercise.exerciseType] = (acc[exercise.exerciseType] || 0) + 1;
      return acc;
    }, {});
    
    res.json({
      totalSessions,
      totalTime,
      averageAccuracy,
      bodyPartDistribution,
      exerciseTypeDistribution,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 