function skillScore(candidateSkills, requiredSkills) {
  if (!requiredSkills.length) return 100;
  const matching = candidateSkills.filter(s => requiredSkills.includes(s.toLowerCase()));
  return (matching.length / requiredSkills.length) * 100;
}

function experienceScore(candidateYears, requiredYears) {
  if (requiredYears === 0) return 100;
  if (!candidateYears) return 0;
  if (candidateYears < requiredYears) {
    return (candidateYears / requiredYears) * 80;
  } else {
    let extra = Math.min(20, ((candidateYears - requiredYears) / requiredYears) * 20);
    return 80 + extra;
  }
}

function overallScore(skill, exp) {
  return Math.round(skill * 0.7 + exp * 0.3);
}

module.exports = { skillScore, experienceScore, overallScore };