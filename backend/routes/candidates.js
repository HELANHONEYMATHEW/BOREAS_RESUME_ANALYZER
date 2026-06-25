const express = require('express');
const Candidate = require('../models/Candidate');
const Job = require('../models/Job');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth(['admin', 'hr', 'recruiter', 'candidate']), async (req, res) => {
  let query = {};
  if (req.user.role === 'candidate') {
    query = { email: req.user.email }; // candidates see only their own submissions
  }
  const candidates = await Candidate.find(query).populate('jobId', 'title');
  res.json(candidates);
});

router.get('/rankings', auth(['admin', 'hr', 'recruiter']), async (req, res) => {
  const candidates = await Candidate.find().sort({ matchScore: -1 }).populate('jobId', 'title');
  res.json(candidates);
});

router.get('/dashboard-stats', auth(['admin', 'hr']), async (req, res) => {
  const totalJobs = await Job.countDocuments();
  const totalCandidates = await Candidate.countDocuments();
  const avg = await Candidate.aggregate([{ $group: { _id: null, avgScore: { $avg: '$matchScore' } } }]);
  const top = await Candidate.findOne().sort({ matchScore: -1 }).select('name matchScore');
  res.json({ totalJobs, totalCandidates, averageScore: avg[0]?.avgScore || 0, topCandidate: top });
});

router.delete('/:id', auth(['admin', 'hr']), async (req, res) => {
  await Candidate.findByIdAndDelete(req.params.id);
  res.status(204).send();
});

module.exports = router;