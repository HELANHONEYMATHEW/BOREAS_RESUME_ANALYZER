const express = require('express');
const InterviewRequest = require('../models/InterviewRequest');
const Application = require('../models/Application');
const auth = require('../middleware/auth');
const router = express.Router();

// Recruiter creates an interview request
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'recruiter') {
      return res.status(403).json({ msg: 'Only recruiters can create requests' });
    }
    const { applicationId, date, time, notes } = req.body;
    const application = await Application.findById(applicationId);
    if (!application) return res.status(404).json({ msg: 'Application not found' });
    
    const request = new InterviewRequest({
      application: applicationId,
      candidate: application.candidate,
      jobTitle: application.jobTitle,
      recruiter: req.user.userId,
      date,
      time,
      notes,
      status: 'pending'
    });
    await request.save();
    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// HR gets all pending requests
router.get('/pending', auth, async (req, res) => {
  if (req.user.role !== 'hr' && req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Access denied' });
  }
  const requests = await InterviewRequest.find({ status: 'pending' })
    .populate('candidate', 'name email')
    .populate('recruiter', 'name')
    .populate('application', 'fullName email');
  res.json(requests);
});

// HR approves or rejects
router.put('/:id', auth, async (req, res) => {
  if (req.user.role !== 'hr' && req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Access denied' });
  }
  const { status } = req.body; // 'approved' or 'rejected'
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ msg: 'Invalid status' });
  }
  const request = await InterviewRequest.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!request) return res.status(404).json({ msg: 'Request not found' });
  res.json(request);
});

// Get all requests for recruiter view
router.get('/my-requests', auth, async (req, res) => {
  if (req.user.role !== 'recruiter') return res.status(403).json({ msg: 'Access denied' });
  const requests = await InterviewRequest.find({ recruiter: req.user.userId })
    .populate('candidate', 'name email')
    .populate('application', 'fullName');
  res.json(requests);
});

module.exports = router;