const express = require('express');
const Job = require('../models/Job');
const auth = require('../middleware/auth');
const router = express.Router();

// GET /api/jobs?search=...&skills=...&page=...&limit=... (candidate)
// GET /api/jobs?all=true (HR)
router.get('/', async (req, res) => {
  try {
    const { search, skills, page, limit, all } = req.query;

    // If ?all=true, return all active jobs without pagination (for HR)
    if (all === 'true') {
      const jobs = await Job.find({ status: 'active' });
      return res.json(jobs);
    }

    // Otherwise, use pagination (for candidate dashboard)
    const query = { status: 'active' };
    const andConditions = [];

    if (search) {
      andConditions.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      });
    }

    if (skills) {
      const skillArray = skills.split(',').map(s => s.trim());
      const skillConditions = skillArray.map(skill => ({
        requiredSkills: { $regex: skill, $options: 'i' }
      }));
      andConditions.push({ $or: skillConditions });
    }

    if (andConditions.length > 0) {
      query.$and = andConditions;
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 5;
    const skip = (pageNum - 1) * limitNum;

    const jobs = await Job.find(query).skip(skip).limit(limitNum);
    const total = await Job.countDocuments(query);

    res.json({
      jobs,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// POST /api/jobs – create a new job (HR/Admin only)
router.post('/', auth, async (req, res) => {
  try {
    if (!['hr', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ msg: 'Access denied' });
    }
    const job = new Job(req.body);
    await job.save();
    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// PUT /api/jobs/:id – update a job (HR/Admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    if (!['hr', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ msg: 'Access denied' });
    }
    const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!job) return res.status(404).json({ msg: 'Job not found' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// DELETE /api/jobs/:id – delete a job (HR/Admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!['hr', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ msg: 'Access denied' });
    }
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ msg: 'Job not found' });
    res.json({ msg: 'Job deleted' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;