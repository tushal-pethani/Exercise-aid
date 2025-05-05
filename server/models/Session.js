const mongoose = require('mongoose');
const { Schema } = mongoose;

const SessionSchema = new Schema({
  patient: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  physiotherapist: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  duration: {
    type: Number,  // in minutes
    default: 0
  },
  exerciseData: {
    type: Object,
    default: {}
  },
  notes: {
    type: String,
    default: ''
  },
  calibrationPoints: {
    type: [Number],
    default: []
  }
});

module.exports = mongoose.model('Session', SessionSchema); 