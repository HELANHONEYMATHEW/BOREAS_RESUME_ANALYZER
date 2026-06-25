import { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { SidebarLogo, Modal, ScoreBadge, StatusPill, Avatar } from '../../components/UI';
import { Briefcase, Upload, History, User, LogOut, Bell, CheckCircle, FileText } from 'lucide-react';
import axios from 'axios';

const NAV = [
  { key: 'jobs', label: 'Browse Jobs', icon: Briefcase },
  { key: 'apply', label: 'Apply Now', icon: Upload },
  { key: 'history', label: 'My Applications', icon: History },
  { key: 'profile', label: 'My Profile', icon: User },
];

export default function CandidateDashboard() {
  const { addToast, currentCandidate, logout } = useApp();
  const [page, setPage] = useState('jobs');
  const [selectedJob, setSelectedJob] = useState(null);

  if (!currentCandidate) return <div>Loading...</div>;

  const applyFor = (job) => {
    if (!job || !job._id) {
      addToast('Invalid job selected', 'error');
      return;
    }
    setSelectedJob(job);
    setPage('apply');
  };

  return (
    <div className="app-shell">
      <nav className="sidebar">
        <SidebarLogo />
        <div className="sidebar-menu">
          <span className="menu-label">Candidate</span>
          {NAV.map(n => {
            const Icon = n.icon;
            return (
              <div key={n.key} className={`menu-item ${page === n.key ? 'active' : ''}`} onClick={() => setPage(n.key)}>
                <Icon size={17} /> {n.label}
              </div>
            );
          })}
        </div>
        <div className="sidebar-bottom">
          <div className="user-mini">
            <Avatar name={currentCandidate.name} color="var(--violet)" />
            <div>
              <div style={{ fontSize: 12, fontWeight: 500 }}>{currentCandidate.name}</div>
              <small style={{ fontSize: 11, color: 'var(--text3)' }}>Candidate</small>
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            <div className="menu-item" style={{ padding: '0.4rem 0', fontSize: 12 }} onClick={logout}>
              <LogOut size={15} /> Sign out
            </div>
          </div>
        </div>
      </nav>
      <div className="main-content">
        <div className="topbar">
          <span className="topbar-title">
            {{ jobs: 'Available Jobs', apply: 'Submit Application', history: 'My Applications', profile: 'My Profile' }[page]}
          </span>
          <div className="topbar-right">
            <span className="role-pill candidate">Candidate</span>
            <div className="icon-btn"><Bell size={15} /></div>
          </div>
        </div>
        <div className="page-body">
          {page === 'jobs' && (
            <JobsPage
              onApply={applyFor}
              candidateName={currentCandidate.name}
              addToast={addToast}
            />
          )}
          {page === 'apply' && selectedJob && (
            <ApplyPage selectedJob={selectedJob} addToast={addToast} onSuccess={() => setPage('history')} />
          )}
          {page === 'history' && <HistoryPage />}
          {page === 'profile' && <ProfilePage candidate={currentCandidate} />}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// JobsPage with search, filter (case‑insensitive), pagination
// ============================================================
function JobsPage({ onApply, candidateName, addToast }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [skillsFilter, setSkillsFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const limit = 5;

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (skillsFilter) params.append('skills', skillsFilter);
      params.append('page', currentPage);
      params.append('limit', limit);

      const res = await axios.get(`http://localhost:5000/api/jobs?${params.toString()}`);
      setJobs(res.data.jobs);
      setTotalPages(res.data.totalPages);
      setTotalJobs(res.data.total);
    } catch (err) {
      console.error(err);
      addToast('Failed to load jobs', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, skillsFilter, currentPage, addToast]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleSkillsChange = (e) => {
    setSkillsFilter(e.target.value);
    setCurrentPage(1);
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleApply = (job) => {
    if (typeof onApply === 'function') {
      onApply(job);
    } else {
      console.error('onApply is not a function', onApply);
      addToast('Unable to apply. Please refresh.', 'error');
    }
  };

  if (loading) return <div>Loading jobs...</div>;

  return (
    <>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input
          className="field-input"
          placeholder="Search by title or description..."
          value={searchTerm}
          onChange={handleSearchChange}
          style={{ flex: 2, minWidth: '200px' }}
        />
        <input
          className="field-input"
          placeholder="Filter by skills (comma separated)"
          value={skillsFilter}
          onChange={handleSkillsChange}
          style={{ flex: 1, minWidth: '150px' }}
        />
      </div>

      <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: '1.25rem' }}>
        Hello {candidateName} 👋 — <strong style={{ color: 'var(--text)' }}>{totalJobs} open positions</strong> match your criteria
      </div>

      <div className="job-grid">
        {jobs.length === 0 ? (
          <div className="card">No jobs found matching your search.</div>
        ) : (
          jobs.map(job => (
            <div key={job._id} className="job-card">
              <div>
                <div className="job-title">{job.title}</div>
                <div className="job-dept">{job.dept} · {job.location}</div>
              </div>
              <div className="tags">
                {(job.requiredSkills || []).map(s => <span key={s} className="tag skill">{s}</span>)}
              </div>
              <div className="job-meta">
                <span>{job.experienceRequired || '-'} yrs exp</span>
                <span>{job.applicants || 0} applicants</span>
              </div>
              <div style={{ marginTop: 4 }}>
                <button className="btn primary sm" onClick={() => handleApply(job)}>
                  Apply Now
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem' }}>
          <button
            className="btn sm"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span style={{ display: 'flex', alignItems: 'center', color: 'var(--text2)' }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="btn sm"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </>
  );
}

// ============================================================
// ApplyPage – with profile refresh and job fallback
// ============================================================
function ApplyPage({ selectedJob, addToast, onSuccess }) {
  const { currentCandidate, jobs, refreshProfile, fetchJobs } = useApp(); // ✅ added fetchJobs
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [extracted, setExtracted] = useState(null);
  const [resumeFilePath, setResumeFilePath] = useState('');
  const [formData, setFormData] = useState({
    fullName: currentCandidate?.name || '',
    email: currentCandidate?.email || '',
    phone: currentCandidate?.phone || '',
    experience: currentCandidate?.experience || '',
    skills: currentCandidate?.skills || [],
    education: currentCandidate?.education || '',
    jobId: selectedJob?._id || (jobs[0]?._id || ''),
  });
  const [skillInput, setSkillInput] = useState('');
  const fileRef = useRef();

  // ✅ If jobs are empty, fetch them once
  useEffect(() => {
    const loadJobs = async () => {
      if (!jobs || jobs.length === 0) {
        setLoadingJobs(true);
        await fetchJobs();
        setLoadingJobs(false);
      }
    };
    loadJobs();
  }, []);

  const updateProfile = async (info) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:5000/api/auth/profile', {
        name: info.name,
        phone: info.phone,
        experience: info.experience,
        skills: info.skills,
        education: info.education
      }, { headers: { 'x-auth-token': token } });
      addToast('Profile updated with extracted information', 'success');
      if (refreshProfile) await refreshProfile();
    } catch (err) {
      console.warn('Profile update failed', err);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setStatus('uploading');
    setErrorMsg('');
    const fd = new FormData();
    fd.append('resume', file);
    fd.append('jobId', formData.jobId);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/upload/resume', fd, {
        headers: { 'x-auth-token': token, 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success && res.data.extractedInfo) {
        const info = res.data.extractedInfo;
        setExtracted(info);
        setResumeFilePath(res.data.resumeFilePath);
        setFormData(prev => ({
          ...prev,
          fullName: info.name || prev.fullName,
          email: info.email || prev.email,
          phone: info.phone || '',
          experience: info.experience || '',
          skills: info.skills || [],
          education: info.education || '',
        }));
        await updateProfile(info);
        setStatus('done');
      } else {
        throw new Error(res.data.error || 'Parsing failed');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || err.message);
      setStatus('error');
    }
  };

  const addSkill = (e) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      if (formData.skills.length >= 20) {
        addToast('Maximum 20 skills allowed', 'warning');
        return;
      }
      setFormData(f => ({ ...f, skills: [...f.skills, skillInput.trim()] }));
      setSkillInput('');
    }
  };
  const removeSkill = (s) => setFormData(f => ({ ...f, skills: f.skills.filter(x => x !== s) }));

  const submit = async () => {
    if (!formData.fullName || !formData.email) {
      addToast('Name and email are required.', 'error');
      return;
    }
    if (!formData.jobId) {
      addToast('Please select a job.', 'error');
      return;
    }

    const selectedJobObj = jobs.find(j => j._id === formData.jobId);
    const jobTitle = selectedJobObj ? selectedJobObj.title : 'Unknown Position';
    const jobId = selectedJobObj ? selectedJobObj._id : null;

    const payload = {
      jobTitle,
      jobId,
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      experience: formData.experience,
      skills: formData.skills,
      education: formData.education,
      resumeText: extracted?.resumeText || '',
      resumeFilePath: resumeFilePath || '',
      matchScore: extracted?.matchScore || 0,
      skillsScore: extracted?.skillsScore || 0,
      experienceScore: extracted?.experienceScore || 0,
      educationScore: extracted?.educationScore || 0,
      matchingSkills: extracted?.matchingSkills || [],
      missingSkills: extracted?.missingSkills || []
    };

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/applications', payload, {
        headers: { 'x-auth-token': token }
      });
      addToast('Application submitted!', 'success');
      if (refreshProfile) await refreshProfile();
      if (typeof onSuccess === 'function') onSuccess();
    } catch (err) {
      console.error('Submission error:', err);
      addToast(err.response?.data?.msg || 'Submission failed', 'error');
    }
  };

  if (loadingJobs) return <div className="card">Loading jobs...</div>;
  if (!jobs || jobs.length === 0) return <div className="card">No jobs available. Please contact HR.</div>;

  return (
    <div className="card">
      <h3 style={{ marginBottom: '1rem' }}>Apply for a Job</h3>
      <div className="upload-zone" onClick={() => fileRef.current.click()}>
        <Upload size={36} color="var(--text3)" />
        <p>Click or drag resume (PDF, DOCX, TXT)</p>
        <small>Max 10MB – we'll extract your details</small>
        <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" onChange={handleUpload} style={{ display: 'none' }} />
      </div>

      {status === 'uploading' && <div className="ocr-indicator processing">Uploading & parsing resume...</div>}
      {status === 'error' && <div className="ocr-indicator error" style={{ color: 'var(--rose)' }}>❌ Error: {errorMsg}</div>}
      {status === 'done' && extracted && (
        <div className="preview-section" style={{ marginTop: '1.5rem' }}>
          <div className="ocr-indicator success">✅ Resume parsed! Edit below if needed.</div>
          <div className="form-grid" style={{ marginTop: '1rem' }}>
            <div>
              <label className="field-label">Job Position</label>
              <select className="field-input" value={formData.jobId} onChange={e => setFormData(f => ({ ...f, jobId: e.target.value }))}>
                {jobs.map(j => <option key={j._id} value={j._id}>{j.title}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Full Name *</label>
              <input className="field-input" value={formData.fullName} onChange={e => setFormData(f => ({ ...f, fullName: e.target.value }))} />
            </div>
            <div>
              <label className="field-label">Email *</label>
              <input className="field-input" value={formData.email} onChange={e => setFormData(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className="field-label">Phone</label>
              <input className="field-input" value={formData.phone} onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <label className="field-label">Experience (years)</label>
              <input className="field-input" value={formData.experience} onChange={e => setFormData(f => ({ ...f, experience: e.target.value }))} />
            </div>
            <div className="full">
              <label className="field-label">Skills (press Enter to add)</label>
              <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '6px 10px', minHeight: 42, display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
                {formData.skills.map(s => (
                  <span key={s} className="tag skill" style={{ cursor: 'pointer' }} onClick={() => removeSkill(s)}>{s} ×</span>
                ))}
                <input style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 13, minWidth: 80 }} placeholder="Type a skill…" value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={addSkill} />
              </div>
            </div>
            <div className="full">
              <label className="field-label">Education</label>
              <textarea className="field-input" rows={2} value={formData.education} onChange={e => setFormData(f => ({ ...f, education: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button className="btn primary" onClick={submit}>Submit Application</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// HistoryPage (unchanged)
// ============================================================
function HistoryPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyApps = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/applications/my-applications', {
          headers: { 'x-auth-token': token }
        });
        setApplications(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyApps();
  }, []);

  if (loading) return <div className="card">Loading your applications...</div>;
  if (applications.length === 0) return <div className="card">No applications submitted yet.</div>;

  return (
    <div className="card card-flush">
      <table className="data-table">
        <thead><tr><th>Job Title</th><th>Applied Date</th><th>Status</th></tr></thead>
        <tbody>
          {applications.map(app => (
            <tr key={app._id}>
              <td>{app.jobTitle}</td>
              <td>{new Date(app.appliedAt).toLocaleDateString()}</td>
              <td><StatusPill status={app.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
// ProfilePage (unchanged)
// ============================================================
function ProfilePage({ candidate }) {
  const { addToast, refreshProfile } = useApp();
  const [form, setForm] = useState({
    name: candidate?.name || '',
    phone: candidate?.phone || '',
    email: candidate?.email || '',
    experience: candidate?.experience || '',
    skills: candidate?.skills || [],
    education: candidate?.education || '',
  });
  const [skillInput, setSkillInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      await refreshProfile();
      setLoading(false);
    };
    loadProfile();
  }, []);

  useEffect(() => {
    setForm({
      name: candidate?.name || '',
      phone: candidate?.phone || '',
      email: candidate?.email || '',
      experience: candidate?.experience || '',
      skills: candidate?.skills || [],
      education: candidate?.education || '',
    });
  }, [candidate]);

  const addSkill = (e) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      setForm(f => ({ ...f, skills: [...f.skills, skillInput.trim()] }));
      setSkillInput('');
    }
  };
  const removeSkill = (s) => setForm(f => ({ ...f, skills: f.skills.filter(x => x !== s) }));

  const saveProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:5000/api/auth/profile', {
        name: form.name,
        phone: form.phone,
        experience: form.experience,
        skills: form.skills,
        education: form.education
      }, { headers: { 'x-auth-token': token } });
      addToast('Profile updated successfully', 'success');
      await refreshProfile();
    } catch (err) {
      addToast('Failed to update profile', 'error');
    }
  };

  if (loading) return <div className="card">Loading profile...</div>;

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: '1.25rem' }}>
        <Avatar name={form.name || "Candidate"} color="var(--violet)" size="lg" />
        <div>
          <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 16 }}>{form.name}</div>
          <div style={{ fontSize: 13, color: 'var(--text2)' }}>{form.email}</div>
          {form.phone && <div style={{ fontSize: 12, color: 'var(--text3)' }}>📞 {form.phone}</div>}
          {form.experience && <div style={{ fontSize: 12, color: 'var(--text3)' }}>💼 {form.experience} years</div>}
        </div>
      </div>
      <div className="form-grid">
        <div><label className="field-label">Full name</label><input className="field-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
        <div><label className="field-label">Phone</label><input className="field-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
        <div><label className="field-label">Email</label><input className="field-input" value={form.email} disabled /></div>
        <div><label className="field-label">Experience (years)</label><input className="field-input" value={form.experience} onChange={e => setForm(f => ({ ...f, experience: e.target.value }))} /></div>
        <div className="full">
          <label className="field-label">Skills (press Enter)</label>
          <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '6px 10px', minHeight: 42, display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
            {form.skills.map(s => <span key={s} className="tag skill" style={{ cursor: 'pointer' }} onClick={() => removeSkill(s)}>{s} ×</span>)}
            <input style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 13, minWidth: 80 }} placeholder="Type a skill…" value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={addSkill} />
          </div>
        </div>
        <div className="full"><label className="field-label">Education</label><textarea className="field-input" rows={2} value={form.education} onChange={e => setForm(f => ({ ...f, education: e.target.value }))} /></div>
      </div>
      <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button className="btn sm" onClick={() => refreshProfile()}>Refresh</button>
        <button className="btn primary sm" onClick={saveProfile}>Save changes</button>
      </div>
    </div>
  );
}