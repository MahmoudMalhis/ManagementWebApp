require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/company_management';

// Test credentials
const testEmail = 'manager@example.com';
const testPassword = 'manager123';

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected successfully');

    try {
      // Find the user
      const user = await User.findOne({ email: testEmail });
      
      if (!user) {
        console.error(`User with email ${testEmail} not found`);
        process.exit(1);
      }

      console.log('User found:', { 
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        passwordHash: user.password.substring(0, 10) + '...' // Just show first 10 chars for security
      });

      // Test direct bcrypt compare
      const isMatch = await bcrypt.compare(testPassword, user.password);
      console.log(`Direct bcrypt comparison result: ${isMatch}`);

      // Test using the model method
      const isMatchWithMethod = await user.matchPassword(testPassword);
      console.log(`Model method comparison result: ${isMatchWithMethod}`);

      // Additional debugging - try with incorrect password
      const isWrongMatch = await bcrypt.compare('wrongpassword', user.password);
      console.log(`Comparison with wrong password: ${isWrongMatch} (should be false)`);

      // Additional debugging - create a new hash and compare
      const salt = await bcrypt.genSalt(10);
      const newHash = await bcrypt.hash(testPassword, salt);
      console.log(`New hash for '${testPassword}': ${newHash}`);
      console.log(`Existing hash in DB: ${user.password}`);
      
      // Check bcrypt version
      console.log(`Bcrypt version: ${bcrypt.version || 'unknown'}`);

      // Close connection
      await mongoose.disconnect();
      console.log('MongoDB disconnected');
    } catch (error) {
      console.error('Error during password verification:', error);
      await mongoose.disconnect();
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });