const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  jobTitle: String,
  fullName: String,
  email: String,
  phone: String,
  experience: String,
  skills: [String],
  education: String,
  resumeText: String,
  resumeFilePath: String,
  matchScore: Number,
  skillsScore: Number,
  experienceScore: Number,
  educationScore: Number,
  matchingSkills: [String],
  missingSkills: [String],
  status: { type: String, enum: ['pending','reviewed','shortlisted','rejected'], default: 'pending' },
  appliedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Application || mongoose.model('Application', applicationSchema);