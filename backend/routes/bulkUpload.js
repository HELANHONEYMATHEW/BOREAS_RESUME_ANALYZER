const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const path = require('path');
const fs = require('fs');
const Job = require('../models/Job');
const auth = require('../middleware/auth');
const router = express.Router();

const uploadDir = path.join(__dirname, '../uploads/bulk');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// ---------- Text Extraction ----------
async function extractTextFromPDF(buffer) {
  const data = await pdfParse(buffer);
  return data.text;
}
async function extractTextFromDOCX(buffer) {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}
async function extractTextFromTXT(buffer) {
  return buffer.toString('utf-8');
}

// ---------- Copy the same helper functions from upload.js ----------
function extractResumeInfo(text) { /* same as above */ }
function computeSkillScore(candidateSkills, jobSkills) { /* same */ }
function computeExperienceScore(candidateExp, jobExpRequired) { /* same */ }
function computeEducationScore(candidateEducation, jobEducationRequired) { /* same */ }
function computeOverallScore(candidateSkills, jobSkills, candidateExp, jobExpRequired, candidateEdu, jobEduRequired) {
  // same as above
  const skillResult = computeSkillScore(candidateSkills, jobSkills);
  const skillsScore = skillResult.matchPercent;
  const expScore = computeExperienceScore(candidateExp, jobExpRequired);
  const eduScore = computeEducationScore(candidateEdu, jobEduRequired);
  const overall = Math.round((skillsScore * 0.6) + (expScore * 0.2) + (eduScore * 0.2));
  return {
    overall,
    skillsScore,
    expScore,
    eduScore,
    matchingSkills: skillResult.matchedSkills,
    missingSkills: skillResult.missingSkills
  };
}

// ---------- Bulk Upload Route ----------
router.post('/bulk', auth, upload.array('resumes', 20), async (req, res) => {
  try {
    if (!['hr', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ msg: 'Access denied' });
    }
    const { jobId } = req.body;
    if (!jobId) return res.status(400).json({ msg: 'jobId required' });

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ msg: 'Job not found' });

    const requiredSkills = job.requiredSkills || [];
    const expRequired = job.experienceRequired;
    const eduRequired = job.educationRequired;

    const results = [];
    for (const file of req.files) {
      const ext = path.extname(file.originalname).toLowerCase();
      let extractedText = '';
      if (ext === '.pdf') extractedText = await extractTextFromPDF(file.buffer);
      else if (ext === '.docx') extractedText = await extractTextFromDOCX(file.buffer);
      else if (ext === '.txt') extractedText = await extractTextFromTXT(file.buffer);
      else continue; // skip unsupported

      const info = extractResumeInfo(extractedText);
      const score = computeOverallScore(
        info.skills,
        requiredSkills,
        info.experience,
        expRequired,
        info.education,
        eduRequired
      );

      results.push({
        fileName: file.originalname,
        extracted: info,
        matchScore: score.overall,
        skillsScore: score.skillsScore,
        experienceScore: score.expScore,
        educationScore: score.eduScore,
        matchingSkills: score.matchingSkills,
        missingSkills: score.missingSkills
      });
    }

    results.sort((a, b) => b.matchScore - a.matchScore);
    res.json({ success: true, rankedCandidates: results });
  } catch (err) {
    console.error('Bulk upload error:', err);
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;