require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/company_management';

// Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected successfully');

    try {
      // Test credentials
      const email = 'manager@example.com';
      const password = 'manager123';

      // Find the user
      const user = await User.findOne({ email });
      
      if (!user) {
        console.error(`User with email ${email} not found`);
        process.exit(1);
      }

      console.log('User found:', { 
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        // Show password hash for debugging (remove in production)
        passwordHash: user.password
      });

      // Test password matching using direct bcrypt compare
      const directMatch = await bcrypt.compare(password, user.password);
      console.log('Direct bcrypt.compare result:', directMatch);

      // Test password matching using the model method
      const modelMatch = await user.matchPassword(password);
      console.log('Model matchPassword result:', modelMatch);

      // Check user.matchPassword method is properly defined
      console.log('matchPassword method exists:', typeof user.matchPassword === 'function');
      
      // Check JWT generation (if we get here)
      if (directMatch) {
        const jwt = require('jsonwebtoken');
        if (!process.env.JWT_SECRET) {
          console.error('JWT_SECRET is missing from environment variables');
          process.exit(1);
        }
        
        // Generate a test token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
          expiresIn: '30d'
        });
        
        console.log('JWT token can be generated:', !!token);
      }

      mongoose.disconnect();
      console.log('MongoDB disconnected');
    } catch (error) {
      console.error('Error testing authentication:', error);
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });