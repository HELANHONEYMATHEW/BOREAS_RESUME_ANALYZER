import { useState } from 'react';
import { Modal } from './UI';

export default function ScheduleModal({ candidate, onClose, onSubmit }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));
  const [time, setTime] = useState('10:00');
  const [notes, setNotes] = useState('');

  return (
    <Modal title="Request Interview" onClose={onClose} footer={
      <>
        <button className="btn sm" onClick={onClose}>Cancel</button>
        <button className="btn primary sm" onClick={() => onSubmit({ candidate, date, time, notes })}>Send Request</button>
      </>
    }>
      <div><strong>Candidate:</strong> {candidate.name}</div>
      <div><strong>Job:</strong> {candidate.job}</div>
      <div className="form-grid" style={{ marginTop: '1rem' }}>
        <div><label className="field-label">Date</label><input className="field-input" type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
        <div><label className="field-label">Time</label><input className="field-input" type="time" value={time} onChange={e => setTime(e.target.value)} /></div>
        <div className="full"><label className="field-label">Notes (optional)</label><textarea className="field-input" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add any notes for HR..." /></div>
      </div>
    </Modal>
  );
}