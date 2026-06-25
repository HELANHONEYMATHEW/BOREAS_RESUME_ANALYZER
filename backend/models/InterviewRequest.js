const mongoose = require('mongoose');

const interviewRequestSchema = new mongoose.Schema({
  application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jobTitle: String,
  recruiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: String,
  time: String,
  notes: String,
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('InterviewRequest', interviewRequestSchema);