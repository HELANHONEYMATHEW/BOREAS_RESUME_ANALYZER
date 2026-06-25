const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const path = require('path');
const fs = require('fs');
const Job = require('../models/Job');
const router = express.Router();

const uploadDir = path.join(__dirname, '../uploads');
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

// ---------- Resume Parsing (enhanced) ----------
function extractResumeInfo(text) {
  // Normalize
  const normalized = text.replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim();
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // Name
  let name = '';
  for (let i = 0; i < Math.min(6, lines.length); i++) {
    const line = lines[i];
    if (line.match(/^[A-Z][a-z]+(?:\s[A-Z][a-z]+){1,3}$/) && !line.includes('@') && !/\d/.test(line)) {
      name = line;
      break;
    }
  }
  if (!name) {
    const nameMatch = text.match(/Name[:\s]+([A-Za-z\s]+)/i);
    if (nameMatch) name = nameMatch[1].trim();
  }

  // Email
  const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  const email = emailMatch ? emailMatch[0] : '';

  // Phone
  const phoneMatch = text.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const phone = phoneMatch ? phoneMatch[0] : '';

  // Experience (years as number)
  let experience = 0;
  const expMatch = text.match(/(\d+)\+?\s*(?:years?|yrs?)/i);
  if (expMatch) {
    experience = parseInt(expMatch[1], 10) || 0;
  }

  // Skills (improved extraction)
  let skills = [];
  const skillHeaders = /(?:Skills|Technical Skills|Core Competencies|Core Skills|Key Skills|Competencies)[:\n\s]+/i;
  const match = text.match(skillHeaders);
  if (match) {
    const start = match.index + match[0].length;
    let rest = text.substring(start, start + 2000);
    const nextSection = rest.match(/\n[A-Z][A-Z\s]+/);
    if (nextSection) {
      rest = rest.substring(0, nextSection.index);
    }
    const skillLines = rest.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    for (const line of skillLines) {
      let cleaned = line.replace(/^[-•*]\s*/, '');
      cleaned = cleaned.replace(/\*\*[^*]+\*\*/g, '');
      const parts = cleaned.split(/[,;|]\s*/);
      for (let part of parts) {
        const parenMatch = part.match(/^([^(]+)\(/);
        if (parenMatch) {
          part = parenMatch[1].trim();
        }
        part = part.replace(/\([^)]*\)/g, '').trim();
        if (part.length >= 2 && part.length <= 30 && !/^(the|of|and|for|with|etc|a|an|to|in|on|at|by|from|up|off|over|under)$/i.test(part)) {
          skills.push(part);
        }
      }
    }
    if (skills.length === 0) {
      for (const line of skillLines) {
        const firstWord = line.split(/[,\s]/)[0].replace(/^[-•*]\s*/, '').trim();
        if (firstWord.length >= 2 && firstWord.length <= 30) {
          skills.push(firstWord);
        }
      }
    }
  }
  if (skills.length === 0) {
    const commonSkills = ['React', 'Node.js', 'Python', 'Java', 'JavaScript', 'TypeScript', 'MongoDB', 'SQL', 'AWS', 'Docker'];
    skills = commonSkills.filter(skill => text.toLowerCase().includes(skill.toLowerCase()));
  }
  skills = [...new Set(skills)].slice(0, 20);

  // Education (raw text)
  const eduMatch = text.match(/(?:Education|Academic Background)[:\n\s]+([^\n]+)/i);
  const education = eduMatch ? eduMatch[1].trim() : '';

  return { name, email, phone, experience, skills, education, resumeText: text.substring(0, 5000) };
}

// ---------- Scoring Functions ----------
function computeSkillScore(candidateSkills, jobSkills) {
  if (!jobSkills || jobSkills.length === 0) {
    return { matchPercent: 0, matchedSkills: [], missingSkills: [] };
  }
  const matched = candidateSkills.filter(skill => jobSkills.includes(skill));
  const matchPercent = Math.round((matched.length / jobSkills.length) * 100);
  return { matchPercent, matchedSkills: matched, missingSkills: jobSkills.filter(s => !candidateSkills.includes(s)) };
}

function computeExperienceScore(candidateExp, jobExpRequired) {
  if (!jobExpRequired) return 100;
  const required = parseInt(jobExpRequired, 10);
  if (isNaN(required)) return 100;
  if (candidateExp >= required) return 100;
  return Math.round((candidateExp / required) * 100);
}

function computeEducationScore(candidateEducation, jobEducationRequired) {
  if (!jobEducationRequired) return 100;
  const levels = ['Bachelor', 'Master', 'PhD', 'Doctorate'];
  const requiredLevel = jobEducationRequired.toLowerCase();
  const candidateLower = candidateEducation.toLowerCase();
  if (candidateLower.includes(requiredLevel)) return 100;
  const requiredIndex = levels.findIndex(l => l.toLowerCase() === requiredLevel);
  if (requiredIndex === -1) return 100;
  for (let i = requiredIndex; i < levels.length; i++) {
    if (candidateLower.includes(levels[i].toLowerCase())) return 100;
  }
  return 0;
}

function computeOverallScore(candidateSkills, jobSkills, candidateExp, jobExpRequired, candidateEdu, jobEduRequired) {
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

// ---------- Route POST /resume ----------
router.post('/resume', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const { jobId } = req.body;
    if (!jobId) return res.status(400).json({ error: 'jobId is required' });

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const file = req.file;
    const ext = path.extname(file.originalname).toLowerCase();
    let extractedText = '';
    if (ext === '.pdf') extractedText = await extractTextFromPDF(file.buffer);
    else if (ext === '.docx') extractedText = await extractTextFromDOCX(file.buffer);
    else if (ext === '.txt') extractedText = await extractTextFromTXT(file.buffer);
    else return res.status(400).json({ error: 'Unsupported file type. Use PDF, DOCX, or TXT.' });

    // Save file to disk
    const uniqueName = Date.now() + '-' + file.originalname;
    const filePath = path.join(uploadDir, uniqueName);
    fs.writeFileSync(filePath, file.buffer);

    // Extract info and compute scores
    const info = extractResumeInfo(extractedText);
    const scoreResult = computeOverallScore(
      info.skills,
      job.requiredSkills || [],
      info.experience,
      job.experienceRequired,
      info.education,
      job.educationRequired
    );

    // Build response
    const response = {
      success: true,
      extractedInfo: {
        ...info,
        matchScore: scoreResult.overall,
        skillsScore: scoreResult.skillsScore,
        experienceScore: scoreResult.expScore,
        educationScore: scoreResult.eduScore,
        matchingSkills: scoreResult.matchingSkills,
        missingSkills: scoreResult.missingSkills
      },
      resumeFilePath: filePath
    };

    res.json(response);
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;