const mongoose = require('mongoose');
const { Schema } = mongoose;

const ExerciseSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  exerciseType: {
    type: String,
    required: true
  },
  bodyPart: {
    type: String,
    required: true
  },
  sets: {
    type: Number,
    required: true
  },
  reps: {
    type: Number,
    required: true
  },
  totalReps: {
    type: Number,
    required: true
  },
  perfectReps: {
    type: Number,
    default: 0
  },
  goodReps: {
    type: Number,
    default: 0
  },
  badReps: {
    type: Number,
    default: 0
  },
  timeTaken: {
    type: Number,
    required: true
  },
  accuracy: {
    type: Number,
    required: true
  },
  targetAngle: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Exercise', ExerciseSchema); 