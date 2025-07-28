require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/company_management';

// Initial test users
const initialUsers = [
  {
    name: 'Admin Manager',
    email: 'manager@example.com',
    password: 'manager123',
    role: 'manager'
  },
  {
    name: 'John Employee',
    email: 'john@example.com',
    password: 'employee123',
    role: 'employee'
  },
  {
    name: 'Sarah Employee',
    email: 'sarah@example.com',
    password: 'employee123',
    role: 'employee'
  }
];

// Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected successfully');

    try {
      // Clear existing users
      await User.deleteMany({});
      console.log('Cleared existing users');

      // Create users with hashed passwords
      const hashedUsers = await Promise.all(
        initialUsers.map(async (user) => {
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(user.password, salt);
          
          return {
            ...user,
            password: hashedPassword
          };
        })
      );

      // Insert the users into the database
      await User.insertMany(hashedUsers);
      
      console.log('Test users created successfully:');
      initialUsers.forEach(user => {
        console.log(`- ${user.name} (${user.email}): ${user.role}, Password: ${user.password}`);
      });
      
      mongoose.disconnect();
      console.log('MongoDB disconnected');
    } catch (error) {
      console.error('Error seeding database:', error);
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });