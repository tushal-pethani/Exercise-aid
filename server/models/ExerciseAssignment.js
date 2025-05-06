const mongoose = require('mongoose');
const { Schema } = mongoose;

const ExerciseAssignmentSchema = new Schema({
  // Physiotherapist who assigned the exercise
  physioId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Client who should perform the exercise
  clientId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Exercise details
  exerciseType: {
    type: String,
    required: true,
    enum: ['biceps', 'legs', 'shoulder', 'custom']
  },
  
  bodyPart: {
    type: String,
    required: true
  },
  
  // Exercise parameters
  targetAngle: {
    type: Number,
    required: true
  },
  
  sets: {
    type: Number,
    required: true,
    min: 1
  },
  
  reps: {
    type: Number,
    required: true,
    min: 1
  },
  
  restTime: {
    type: Number, // Rest time in seconds
    required: true,
    min: 5
  },
  
  // Assignment status
  status: {
    type: String,
    required: true,
    enum: ['pending', 'accepted', 'completed', 'rejected'],
    default: 'pending'
  },
  
  // Notes from physiotherapist
  notes: {
    type: String,
    default: ''
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // When the client completes the exercise
  completedAt: {
    type: Date
  }
});

module.exports = mongoose.model('ExerciseAssignment', ExerciseAssignmentSchema); 