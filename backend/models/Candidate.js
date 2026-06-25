const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  name: String,
  email: String,
  phone: String,
  skills: [String],
  education: String,
  experienceYears: Number,
  matchScore: Number,
  skillScore: Number,
  expScore: Number,
  matchingSkills: [String],
  missingSkills: [String],
  strengths: [String],
  improvements: [String],
  rawText: String,
  status: { type: String, enum: ['pending', 'reviewed', 'interview_scheduled', 'rejected'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Candidate', candidateSchema);