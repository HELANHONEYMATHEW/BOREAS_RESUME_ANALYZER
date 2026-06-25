import { useApp } from '../context/AppContext';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

export function Toast() {
  const { toasts } = useApp();
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          {t.type === 'success' ? <CheckCircle size={16} color="var(--emerald)" /> : <AlertCircle size={16} color="var(--rose)" />}
          {t.msg}
        </div>
      ))}
    </div>
  );
}

export function Modal({ title, onClose, children, footer }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export function ScoreBadge({ value }) {
  const cls = value >= 80 ? 'high' : value >= 60 ? 'mid' : 'low';
  return <span className="score-ring"><span className={`score-dot ${cls}`} />{value}%</span>;
}

export function StatusPill({ status }) {
  const labels = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected', scheduled: 'Interview', reviewed: 'Reviewed', active: 'Active', draft: 'Draft', closed: 'Closed' };
  return <span className={`status-pill ${status}`}>{labels[status] || status}</span>;
}

export function Avatar({ name, color, size }) {
  const initials = name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  return (
    <div className={`avatar ${size === 'lg' ? 'avatar-lg' : ''}`} style={color ? { background: color } : {}}>
      {initials}
    </div>
  );
}

export function SkillBar({ label, value, color }) {
  const c = color || (value >= 80 ? 'var(--emerald)' : value >= 60 ? 'var(--amber)' : 'var(--rose)');
  return (
    <div className="skill-bar-row">
      <span className="skill-name">{label}</span>
      <div className="skill-bar-bg"><div className="skill-bar-fill" style={{ width: `${value}%`, background: c }} /></div>
      <span style={{ fontSize: 11, color: 'var(--text2)', width: 28, textAlign: 'right' }}>{value}%</span>
    </div>
  );
}

export function LogoBadge() {
  return <div className="logo-badge">⚡</div>;
}

export function SidebarLogo() {
  return (
    <div className="sidebar-logo">
      <LogoBadge /> BOREAS
    </div>
  );
}