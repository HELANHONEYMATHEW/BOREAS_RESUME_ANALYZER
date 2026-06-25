import { useState } from "react";
import { useApp } from "./context/AppContext";
import { LogoBadge, Modal } from "./components/UI";
import { User, Building, Shield, Users, Briefcase, ArrowLeft } from "lucide-react";
import axios from "axios";

const ROLES = [
  { key: 'admin', label: 'Admin', icon: Shield, desc: 'Full access + user management', color: 'var(--amber)' },
  { key: 'hr', label: 'HR', icon: Users, desc: 'Approvals, analytics, job management', color: 'var(--sky)' },
  { key: 'recruiter', label: 'Recruiter', icon: Briefcase, desc: 'View candidates, schedule interviews', color: 'var(--emerald)' },
];

export default function LoginScreen() {
  const { setScreen, setRole, loginCandidate, signupCandidate } = useApp();
  const [step, setStep] = useState('main');
  const [selectedRole, setSelectedRole] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showSignup, setShowSignup] = useState(false);
  const [signupData, setSignupData] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });

  // Universal login for any role (candidate, hr, recruiter, admin)
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      // Store in context
      if (user.role === 'candidate') {
        // Use the context's loginCandidate to also set currentCandidate
        await loginCandidate(email, password);
      } else {
        setRole(user.role);
      }
      // Redirect based on role
      if (user.role === 'candidate') setScreen('candidate');
      else if (user.role === 'hr' || user.role === 'admin') setScreen('hr');
      else if (user.role === 'recruiter') setScreen('recruiter');
      else setError('Unknown role');
    } catch (err) {
      setError(err.response?.data?.msg || 'Login failed');
    }
  };

  const handleSignupSubmit = async () => {
    if (signupData.password !== signupData.confirm) {
      alert("Passwords do not match!");
      return;
    }
    const success = await signupCandidate({
      name: signupData.name,
      email: signupData.email,
      phone: signupData.phone,
      password: signupData.password,
    });
    if (success) {
      alert("Account created! You are now logged in.");
      setShowSignup(false);
      setSignupData({ name: '', email: '', phone: '', password: '', confirm: '' });
    } else {
      alert("Email already exists or signup failed.");
    }
  };

  const selectRole = (r) => {
    setSelectedRole(r);
    setError('');
    setStep('roleLogin');
  };

  if (step === 'candidate') return (
    <div className="auth-screen">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 18 }}>
        <LogoBadge /> BOREAS
      </div>
      <div className="auth-form">
        <div>
          <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 18, marginBottom: 4 }}>Candidate sign-in</div>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>Browse jobs and track your applications</div>
        </div>
        {error && <div className="error-msg">{error}</div>}
        <div><label className="field-label">Email</label><input className="field-input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} /></div>
        <div><label className="field-label">Password</label><input className="field-input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} /></div>
        <button className="btn primary btn-full" onClick={handleLogin}>Sign in</button>
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <button className="back-link" onClick={() => setShowSignup(true)}>Create an account</button>
        </div>
        <div style={{ textAlign: 'center' }}>
          <button className="back-link" onClick={() => { setStep('main'); setError(''); setEmail(''); setPassword(''); }}>
            <ArrowLeft size={14} /> Back
          </button>
        </div>
      </div>

      {showSignup && (
        <Modal
          title="Create Candidate Account"
          onClose={() => setShowSignup(false)}
          footer={
            <>
              <button className="btn sm" onClick={() => setShowSignup(false)}>Cancel</button>
              <button className="btn primary sm" onClick={handleSignupSubmit}>Sign up</button>
            </>
          }
        >
          <div className="form-grid">
            <div className="full"><label className="field-label">Full name *</label><input className="field-input" placeholder="e.g. Kaeya Favonius" value={signupData.name} onChange={e => setSignupData({...signupData, name: e.target.value})} /></div>
            <div className="full"><label className="field-label">Email *</label><input className="field-input" type="email" placeholder="you@example.com" value={signupData.email} onChange={e => setSignupData({...signupData, email: e.target.value})} /></div>
            <div className="full"><label className="field-label">Phone</label><input className="field-input" placeholder="+1 555 000 0000" value={signupData.phone} onChange={e => setSignupData({...signupData, phone: e.target.value})} /></div>
            <div><label className="field-label">Password *</label><input className="field-input" type="password" placeholder="••••••••" value={signupData.password} onChange={e => setSignupData({...signupData, password: e.target.value})} /></div>
            <div><label className="field-label">Confirm password *</label><input className="field-input" type="password" placeholder="••••••••" value={signupData.confirm} onChange={e => setSignupData({...signupData, confirm: e.target.value})} /></div>
          </div>
        </Modal>
      )}
    </div>
  );

  if (step === 'roleSelect') return (
    <div className="auth-screen">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 18 }}><LogoBadge /> BOREAS</div>
      <div style={{ textAlign: 'center' }}><div style={{ fontFamily: "'Space Grotesk'", fontSize: 24, fontWeight: 700 }}>Select your role</div><div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 6 }}>Choose your access level to continue</div></div>
      <div className="role-cards">
        {ROLES.map(r => {
          const Icon = r.icon;
          return (
            <div key={r.key} className={`role-card ${selectedRole === r.key ? 'selected' : ''}`} onClick={() => selectRole(r.key)}>
              <Icon size={30} color={r.color} />
              <span style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 15 }}>{r.label}</span>
              <small style={{ color: 'var(--text2)', fontSize: 11 }}>{r.desc}</small>
            </div>
          );
        })}
      </div>
      <button className="back-link" onClick={() => setStep('main')}><ArrowLeft size={14} /> Back to main login</button>
    </div>
  );

  if (step === 'roleLogin') {
    const roleInfo = ROLES.find(r => r.key === selectedRole);
    const Icon = roleInfo.icon;
    return (
      <div className="auth-screen">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 18 }}><LogoBadge /> BOREAS</div>
        <div className="role-badge-row" style={{ maxWidth: 400, width: '100%' }}>
          <Icon size={16} color="var(--violet-l)" />
          <span style={{ color: 'var(--violet-l)', fontWeight: 500, fontSize: 13 }}>{roleInfo.label}</span>
          <span style={{ color: 'var(--text3)', fontSize: 12, marginLeft: 'auto' }}>{roleInfo.desc}</span>
        </div>
        <div className="auth-form">
          <div><div style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 18, marginBottom: 4 }}>Sign in as {roleInfo.label}</div></div>
          {error && <div className="error-msg">{error}</div>}
          <div><label className="field-label">Email</label><input className="field-input" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} /></div>
          <div><label className="field-label">Password</label><input className="field-input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} /></div>
          <button className="btn primary btn-full" onClick={handleLogin}>Sign in</button>
          <div style={{ textAlign: 'center' }}>
            <button className="back-link" onClick={() => { setStep('roleSelect'); setError(''); setEmail(''); setPassword(''); setSelectedRole(null); }}>
              <ArrowLeft size={14} /> Back to role selection
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main login screen
  return (
    <div className="auth-screen">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 20 }}>
        <LogoBadge /> BOREAS
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: "'Space Grotesk'", fontSize: 30, fontWeight: 700 }}>Smart Resume Analyzer</div>
        <div style={{ fontSize: 14, color: 'var(--text2)', marginTop: 6 }}>ATS-powered hiring, streamlined from upload to offer</div>
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', width: '100%', maxWidth: 480 }}>
        <button className="portal-btn" onClick={() => setStep('candidate')}>
          <User size={28} color="var(--violet-l)" />
          <span style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 15 }}>Candidate Login</span>
          <small style={{ color: 'var(--text2)', fontSize: 12, textAlign: 'center' }}>Browse jobs & submit your resume</small>
        </button>
        <button className="portal-btn" onClick={() => setStep('roleSelect')}>
          <Building size={28} color="var(--violet-l)" />
          <span style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 15 }}>Recruiter Portal</span>
          <small style={{ color: 'var(--text2)', fontSize: 12, textAlign: 'center' }}>Admin, HR & Recruiter access</small>
        </button>
      </div>
    </div>
  );
}