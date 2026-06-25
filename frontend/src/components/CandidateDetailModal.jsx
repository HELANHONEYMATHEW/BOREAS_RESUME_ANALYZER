import { Modal, Avatar, ScoreBadge, StatusPill, SkillBar } from './UI';   // changed from "../../components/UI"
export default function CandidateDetailModal({ candidate, onClose, onSchedule, showDelete, onDelete }) {
  if (!candidate) return null;
  return (
    <Modal
      title="Candidate Details"
      onClose={onClose}
      footer={
        <>
          {showDelete && <button className="btn danger sm" onClick={() => onDelete(candidate.id)}>Delete</button>}
          <button className="btn sm" onClick={onClose}>Close</button>
          {onSchedule && <button className="btn primary sm" onClick={() => { onClose(); onSchedule(candidate); }}>Schedule Interview</button>}
        </>
      }
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <Avatar name={candidate.name} color="var(--violet)" size="lg" />
        <div>
          <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 15 }}>{candidate.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>Applied for: {candidate.job}</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{candidate.email}</div>
        </div>
      </div>
      <div className="info-grid">
        <div className="info-item"><label>Match score</label><span style={{ color: 'var(--emerald)', fontWeight: 700 }}>{candidate.match}%</span></div>
        <div className="info-item"><label>Experience</label><span>{candidate.experience}</span></div>
        <div className="info-item"><label>Education</label><span style={{ fontSize: 12 }}>{candidate.education}</span></div>
        <div className="info-item"><label>Status</label><span><StatusPill status={candidate.status} /></span></div>
      </div>
      <div>
        <label className="field-label" style={{ marginBottom: 8 }}>Skill analysis</label>
        <SkillBar label="Overall" value={candidate.skills} />
        {candidate.matchingSkills.map((s, i) => <SkillBar key={s} label={s} value={Math.max(70, candidate.skills - i * 8)} />)}
        {candidate.missingSkills.slice(0, 2).map((s, i) => <SkillBar key={s} label={s} value={30 + i * 10} />)}
      </div>
      <div>
        <label className="field-label" style={{ marginBottom: 6 }}>Matching skills</label>
        <div className="tags">{candidate.matchingSkills.map(s => <span key={s} className="tag skill">{s}</span>)}</div>
      </div>
      <div>
        <label className="field-label" style={{ marginBottom: 6 }}>Missing skills</label>
        <div className="tags">{candidate.missingSkills.map(s => <span key={s} className="tag missing">{s}</span>)}</div>
      </div>
      <div style={{ fontSize: 12, padding: '8px 10px', background: 'var(--surface2)', borderRadius: 8, color: 'var(--text2)' }}>
        <strong style={{ color: 'var(--text)' }}>Strengths:</strong> {candidate.strengths}
      </div>
      <div style={{ fontSize: 12, padding: '8px 10px', background: 'var(--surface2)', borderRadius: 8, color: 'var(--text2)' }}>
        <strong style={{ color: 'var(--text)' }}>Improvements:</strong> {candidate.improvements}
      </div>
    </Modal>
  );
}
