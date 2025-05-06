// Test script to manually add an exercise to the database
require('dotenv').config();
const mongoose = require('mongoose');
const Exercise = require('../server/models/Exercise');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/physiotherapy';

async function createTestExercise() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create a test user ID (replace with an actual user ID from your database)
    const testUserId = mongoose.Types.ObjectId();

    // Create a sample exercise
    const testExercise = new Exercise({
      userId: testUserId,
      username: 'testuser',
      exerciseType: 'lateral_raise',
      bodyPart: 'shoulder',
      sets: 3,
      reps: 10,
      totalReps: 30,
      perfectReps: 20,
      goodReps: 8,
      badReps: 2,
      timeTaken: 180, // 3 minutes
      accuracy: 85.5,
      targetAngle: 90,
      date: new Date()
    });

    // Save to database
    const savedExercise = await testExercise.save();
    console.log('Test exercise created successfully:');
    console.log(JSON.stringify(savedExercise, null, 2));

    // Close connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error creating test exercise:', error);
  }
}

// Run the function
createTestExercise();
