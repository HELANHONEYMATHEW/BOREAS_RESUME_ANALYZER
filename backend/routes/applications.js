const express = require('express');
const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const auth = require('../middleware/auth');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// ===== Submit application (candidate) =====
router.post('/', auth, async (req, res) => {
  try {
    const {
      jobTitle, jobId, fullName, email, phone, experience, skills,
      education, resumeText, resumeFilePath,
      matchScore, skillsScore, experienceScore, educationScore,
      matchingSkills, missingSkills
    } = req.body;

    // Find the job
    let job;
    if (jobId) {
      job = await Job.findById(jobId);
    } else {
      job = await Job.findOne({ title: jobTitle });
    }
    if (!job) {
      return res.status(404).json({ msg: 'Job not found' });
    }

    // Create application
    const application = new Application({
      candidate: req.user.userId,
      jobTitle: job.title,
      fullName: fullName || '',
      email: email || '',
      phone: phone || '',
      experience: experience || '',
      skills: skills || [],
      education: education || '',
      resumeText: resumeText || '',
      resumeFilePath: resumeFilePath || '',
      matchScore: matchScore || 0,
      skillsScore: skillsScore || 0,
      experienceScore: experienceScore || 0,
      educationScore: educationScore || 0,
      matchingSkills: matchingSkills || [],
      missingSkills: missingSkills || []
    });
    await application.save();

    // Update candidate profile (skip email to avoid duplicate key error)
    const user = await User.findById(req.user.userId);
    if (user) {
      if (fullName) user.name = fullName;
      // ✅ DO NOT update email – it's the login credential and must remain unique
      if (phone) user.phone = phone;
      if (experience) user.experience = experience;
      if (skills && skills.length) user.skills = skills;
      if (education) user.education = education;
      await user.save();
    }

    // Increment job applicants count
    job.applicants = (job.applicants || 0) + 1;
    await job.save();

    res.status(201).json({ success: true, application });
  } catch (err) {
    console.error('Submit error:', err);
    res.status(500).json({ msg: err.message });
  }
});

// ===== Candidate's own applications =====
router.get('/my-applications', auth, async (req, res) => {
  try {
    if (req.user.role !== 'candidate') {
      return res.status(403).json({ msg: 'Access denied' });
    }
    const apps = await Application.find({ candidate: req.user.userId })
      .select('jobTitle appliedAt status')
      .sort({ appliedAt: -1 });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ===== All applications (HR, Admin, Recruiter) =====
router.get('/', auth, async (req, res) => {
  try {
    if (!['hr', 'admin', 'recruiter'].includes(req.user.role)) {
      return res.status(403).json({ msg: 'Access denied' });
    }
    const apps = await Application.find()
      .populate('candidate', 'name email')
      .sort({ appliedAt: -1 });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ===== Single application details =====
router.get('/:id', auth, async (req, res) => {
  try {
    if (!['hr', 'admin', 'recruiter'].includes(req.user.role)) {
      return res.status(403).json({ msg: 'Access denied' });
    }
    const app = await Application.findById(req.params.id)
      .populate('candidate', 'name email');
    if (!app) return res.status(404).json({ msg: 'Application not found' });
    res.json(app);
  } catch (err) {
    console.error('Fetch detail error:', err);
    res.status(500).json({ msg: err.message });
  }
});

// ===== Update application status (HR/Admin) =====
router.put('/:id/status', auth, async (req, res) => {
  try {
    if (req.user.role !== 'hr' && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied' });
    }
    const { status } = req.body;
    if (!['pending', 'reviewed', 'shortlisted', 'rejected'].includes(status)) {
      return res.status(400).json({ msg: 'Invalid status' });
    }
    const app = await Application.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!app) return res.status(404).json({ msg: 'Application not found' });
    res.json(app);
  } catch (err) {
    console.error('Status update error:', err);
    res.status(500).json({ msg: err.message });
  }
});

// ===== Download resume file =====
router.get('/download/:id', auth, async (req, res) => {
  try {
    if (!['hr', 'admin', 'recruiter'].includes(req.user.role)) {
      return res.status(403).json({ msg: 'Access denied' });
    }
    const app = await Application.findById(req.params.id);
    if (!app || !app.resumeFilePath) {
      return res.status(404).json({ msg: 'Resume file not found' });
    }
    if (fs.existsSync(app.resumeFilePath)) {
      res.download(app.resumeFilePath);
    } else {
      res.status(404).json({ msg: 'File missing on server' });
    }
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;