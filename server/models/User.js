const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: [/.+\@.+\..+/, 'Please fill a valid email address']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  age: {
    type: Number,
    required: true,
    min: 1
  },
  profilePicture: {
    type: String,
    default: 'https://via.placeholder.com/150'
  },
  role: {
    type: String,
    enum: ['client', 'Client', 'physio', 'Physio', 'CLIENT', 'PHYSIO'],
    required: true
  },
  // Fields specific to physio role
  specialties: {
    type: [String],
    default: []
  },
  qualifications: {
    type: [String],
    default: []
  },
  // Fields specific to client role
  medicalConditions: {
    type: [String],
    default: []
  },
  // User settings
  settings: {
    notificationsEnabled: {
      type: Boolean,
      default: true
    },
    darkMode: {
      type: Boolean,
      default: false
    },
    language: {
      type: String,
      default: 'en'
    }
  },
  // Connection management
  connections: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema); 