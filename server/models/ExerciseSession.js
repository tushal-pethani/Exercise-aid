const mongoose = require('mongoose');
const { Schema } = mongoose;

const ExerciseSessionSchema = new Schema({
  // Reference to the exercise
  exercise: {
    type: Schema.Types.ObjectId,
    ref: 'Exercise',
    required: true
  },
  
  // User who performed the exercise
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Session data
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  completed: {
    type: Boolean,
    default: false
  },
  
  // Performance metrics
  metrics: {
    accuracy: {
      type: Number, // Percentage of accuracy (0-100)
      default: 0
    },
    totalTime: {
      type: Number, // In seconds
      default: 0
    },
    setsCompleted: {
      type: Number,
      default: 0
    },
    repsCompleted: {
      type: Number,
      default: 0
    },
    // Angle data for visualization
    angleData: [{
      time: Number,
      angle: Number,
      velocity: Number
    }],
    // Deviations from target angle
    deviations: {
      count: {
        type: Number,
        default: 0
      },
      average: {
        type: Number,
        default: 0
      }
    },
    // Velocity warnings
    velocityWarnings: {
      type: Number,
      default: 0
    }
  },
  
  // Feedback
  feedback: {
    rating: {
      type: String,
      enum: ['poor', 'average', 'good', 'excellent'],
      default: 'average'
    },
    comments: {
      type: String,
      default: ''
    },
    suggestions: {
      type: String,
      default: ''
    }
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate session duration when endTime is set
ExerciseSessionSchema.pre('save', function(next) {
  if (this.endTime) {
    const durationMs = this.endTime - this.startTime;
    this.metrics.totalTime = Math.round(durationMs / 1000);
  }
  next();
});

module.exports = mongoose.model('ExerciseSession', ExerciseSessionSchema); 