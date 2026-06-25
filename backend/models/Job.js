const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: String,
  dept: String,
  location: String,
  requiredSkills: [String],
  experienceRequired: String,
  educationRequired: String,   // new field
  status: { type: String, enum: ['active', 'draft', 'closed'], default: 'active' },
  description: String,
  applicants: { type: Number, default: 0 }
});

module.exports = mongoose.models.Job || mongoose.model('Job', jobSchema);