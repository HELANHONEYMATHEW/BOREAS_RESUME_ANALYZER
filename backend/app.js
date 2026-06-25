require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jobRoutes = require('./routes/jobs');

const authRoutes = require('./routes/auth');
const applicationRoutes = require('./routes/applications');
const uploadRoutes = require('./routes/upload');
const User = require('./models/User');
const bulkRoutes = require('./routes/bulkUpload');
const interviewRoutes = require('./routes/interviews');
const userRoutes = require('./routes/users');
const settingsRoutes = require('./routes/settings');

// CREATE APP FIRST
const app = express();

// MIDDLEWARE
app.use(cors());
app.use(express.json());
app.use('/api/bulk', bulkRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/upload', uploadRoutes);

// Seed users (candidates, HR, recruiter, admin)
const seedCandidates = async () => {
  // 1. Candidates
  const candidates = [
    { name: 'Kaeya Favonius', email: 'kaeya@example.com', phone: '1234567890', password: 'kaeya@123', role: 'candidate' },
    { name: 'Malipo Kinich', email: 'malipo@example.com', phone: '0987654321', password: 'malipo@123', role: 'candidate' },
    { name: 'Lohen Knight', email: 'lohen@example.com', phone: '1122334455', password: 'lohen@123', role: 'candidate' }
  ];
  for (const c of candidates) {
    const exists = await User.findOne({ email: c.email });
    if (!exists) {
      const hashed = await bcrypt.hash(c.password, 10);
      await User.create({ ...c, password: hashed });
      console.log(`Seeded candidate: ${c.name}`);
    }
  }

  // 2. HR
  const hrExists = await User.findOne({ email: 'hr@boreas.com' });
  if (!hrExists) {
    const hashedHr = await bcrypt.hash('hr@123', 10);
    await User.create({
      name: 'HR Manager',
      email: 'hr@boreas.com',
      phone: '',
      password: hashedHr,
      role: 'hr'
    });
    console.log('Seeded HR: hr@boreas.com / hr@123');
  }

  // 3. Recruiter
  const recruiterExists = await User.findOne({ email: 'recruiter@boreas.com' });
  if (!recruiterExists) {
    const hashedRec = await bcrypt.hash('rec@123', 10);
    await User.create({
      name: 'Recruiter',
      email: 'recruiter@boreas.com',
      phone: '',
      password: hashedRec,
      role: 'recruiter'
    });
    console.log('Seeded Recruiter: recruiter@boreas.com / rec@123');
  }

  // 4. Admin
  const adminExists = await User.findOne({ email: 'admin@boreas.com' });
  if (!adminExists) {
    const hashedAdmin = await bcrypt.hash('adm@123', 10);
    await User.create({
      name: 'Admin',
      email: 'admin@boreas.com',
      phone: '',
      password: hashedAdmin,
      role: 'admin'
    });
  }
};

mongoose.connection.once('open', () => seedCandidates());

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));