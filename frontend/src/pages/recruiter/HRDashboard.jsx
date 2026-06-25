import { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { SidebarLogo, Modal, ScoreBadge, StatusPill, Avatar } from '../../components/UI';
import { LayoutDashboard, Briefcase, Users, CalendarCheck, BarChart2, Upload, UserCog, Settings, LogOut, Bell, Download, Plus, Trash2, Edit3, CheckCircle, XCircle, FileText, Eye } from 'lucide-react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, Cell } from 'recharts';

function buildNav(role) {
  const base = [
    { key: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'jobs', label: 'Jobs', icon: Briefcase },
    { key: 'applications', label: 'Applications', icon: FileText },
    { key: 'approvals', label: 'Interview Approvals', icon: CalendarCheck },
  ];
  if (role !== 'admin') {
    base.push({ key: 'upload', label: 'Bulk Upload', icon: Upload });
  }
  if (role === 'admin') {
    base.push({ key: 'users', label: 'User Management', icon: UserCog, section: 'Admin' });
    base.push({ key: 'settings', label: 'System Settings', icon: Settings });
  }
  return base;
}

export default function HRDashboard() {
  const { role, setScreen, addToast, jobs: contextJobs, users, setUsers, fetchMaintenanceStatus } = useApp();

  const [page, setPage] = useState('overview');
  const [applications, setApplications] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bulkJobId, setBulkJobId] = useState('');
  const [bulkFiles, setBulkFiles] = useState([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [rankedCandidates, setRankedCandidates] = useState([]);
  const bulkFileInputRef = useRef(null);
  const [stats, setStats] = useState({ totalJobs: 0, totalApplications: 0, avgMatchScore: 0 });
  const [scoreDistribution, setScoreDistribution] = useState([]);
  const [applicationsOverTime, setApplicationsOverTime] = useState([]);
  const [jobModalOpen, setJobModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [jobForm, setJobForm] = useState({ title: '', dept: '', location: '', requiredSkills: [], experienceRequired: '', status: 'active', description: '' });
  const [skillInput, setSkillInput] = useState('');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState(null);
  const [maintenanceToggle, setMaintenanceToggle] = useState(false);
  const [localJobs, setLocalJobs] = useState([]);
  const [localJobsLoading, setLocalJobsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  // Profile modal
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [candidateProfile, setCandidateProfile] = useState(null);

  const isAdmin = role === 'admin';
  const userInfo = isAdmin
    ? { name: 'Admin', initials: 'AD', color: 'var(--amber)', rolePill: 'admin', roleLabel: 'Admin' }
    : { name: 'HR@BOREAS', initials: 'MK', color: 'var(--sky)', rolePill: 'hr', roleLabel: 'HR' };

  const nav = buildNav(role);
  const pageTitle = nav.find(n => n.key === page)?.label || '';

  // ===== Fetch jobs (all) =====
  const fetchJobsDirectly = async () => {
    setLocalJobsLoading(true);
    setApiError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/jobs?all=true', {
        headers: { 'x-auth-token': token }
      });
      if (Array.isArray(res.data)) {
        setLocalJobs(res.data);
      } else {
        setApiError(res.data);
        setLocalJobs([]);
      }
    } catch (err) {
      setApiError(err.response?.data || { msg: err.message });
      setLocalJobs([]);
    } finally {
      setLocalJobsLoading(false);
    }
  };

  useEffect(() => {
    if (Array.isArray(contextJobs) && contextJobs.length > 0) {
      setLocalJobs(contextJobs);
      setLocalJobsLoading(false);
    } else {
      fetchJobsDirectly();
    }
  }, []);

  // ===== Fetch applications =====
  const fetchApplications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/applications', {
        headers: { 'x-auth-token': token }
      });
      setApplications(res.data);
      computeStats(res.data);
    } catch (err) {
      addToast('Failed to load applications', 'error');
    } finally {
      setLoading(false);
    }
  };

  const computeStats = (apps) => {
    const totalJobs = localJobs.length;
    const totalApplications = apps.length;
    const totalScore = apps.reduce((sum, app) => sum + (app.matchScore || 0), 0);
    const avgScore = apps.length > 0 ? Math.round(totalScore / apps.length) : 0;
    setStats({ totalJobs, totalApplications, avgMatchScore: avgScore });

    const buckets = [0, 0, 0, 0, 0];
    apps.forEach(app => {
      const score = app.matchScore || 0;
      if (score <= 20) buckets[0]++;
      else if (score <= 40) buckets[1]++;
      else if (score <= 60) buckets[2]++;
      else if (score <= 80) buckets[3]++;
      else buckets[4]++;
    });
    setScoreDistribution([
      { range: '0-20', count: buckets[0] },
      { range: '21-40', count: buckets[1] },
      { range: '41-60', count: buckets[2] },
      { range: '61-80', count: buckets[3] },
      { range: '81-100', count: buckets[4] },
    ]);

    const dateMap = new Map();
    apps.forEach(app => {
      const date = new Date(app.appliedAt).toISOString().slice(0, 10);
      dateMap.set(date, (dateMap.get(date) || 0) + 1);
    });
    const sortedDates = Array.from(dateMap.keys()).sort();
    const overTime = sortedDates.map(date => ({ date, count: dateMap.get(date) }));
    setApplicationsOverTime(overTime.slice(-30));
  };

  const fetchPendingRequests = async () => {
    setLoadingRequests(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/interviews/pending', {
        headers: { 'x-auth-token': token }
      });
      setPendingRequests(res.data);
    } catch (err) {
      addToast('Failed to load requests', 'error');
    } finally {
      setLoadingRequests(false);
    }
  };

  const fetchUsers = async () => {
    setUserLoading(true);
    setUserError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/users', {
        headers: { 'x-auth-token': token }
      });
      setUsers(res.data);
    } catch (err) {
      setUserError(err.response?.data?.msg || err.message);
      addToast('Failed to load users', 'error');
    } finally {
      setUserLoading(false);
    }
  };

  const fetchMaintenanceStatusForSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/settings/maintenance', {
        headers: { 'x-auth-token': token }
      });
      setMaintenanceToggle(res.data.maintenanceMode);
    } catch (err) {
      console.error('Failed to fetch maintenance status', err);
    }
  };

  useEffect(() => {
    if (page === 'overview' || page === 'applications') fetchApplications();
    if (page === 'approvals') fetchPendingRequests();
    if (page === 'users' && isAdmin) fetchUsers();
    if (page === 'settings' && isAdmin) fetchMaintenanceStatusForSettings();
  }, [page]);

  // ===== Profile fetch =====
  const fetchCandidateProfile = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/users/profile/${userId}`, {
        headers: { 'x-auth-token': token }
      });
      setCandidateProfile(res.data);
      setProfileModalOpen(true);
    } catch (err) {
      addToast('Failed to load candidate profile', 'error');
    }
  };

  // ===== Job CRUD =====
  const handleCreateJob = () => {
    setEditingJob(null);
    setJobForm({ title: '', dept: '', location: '', requiredSkills: [], experienceRequired: '', status: 'active', description: '' });
    setSkillInput('');
    setJobModalOpen(true);
  };

  const handleEditJob = (job) => {
    setEditingJob(job);
    setJobForm({
      title: job.title || '',
      dept: job.dept || '',
      location: job.location || '',
      requiredSkills: job.requiredSkills || job.skills || [],
      experienceRequired: job.experienceRequired || job.exp || '',
      status: job.status || 'active',
      description: job.description || ''
    });
    setSkillInput('');
    setJobModalOpen(true);
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/jobs/${jobId}`, {
        headers: { 'x-auth-token': token }
      });
      addToast('Job deleted', 'success');
      fetchJobsDirectly();
    } catch (err) {
      addToast('Failed to delete job', 'error');
    }
  };

  const addSkill = (e) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      setJobForm(prev => ({
        ...prev,
        requiredSkills: [...prev.requiredSkills, skillInput.trim()]
      }));
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setJobForm(prev => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter(s => s !== skillToRemove)
    }));
  };

  const saveJob = async () => {
    if (!jobForm.title) {
      addToast('Job title is required', 'error');
      return;
    }
    const jobData = {
      title: jobForm.title,
      dept: jobForm.dept,
      location: jobForm.location,
      requiredSkills: jobForm.requiredSkills,
      experienceRequired: jobForm.experienceRequired,
      status: jobForm.status,
      description: jobForm.description
    };
    try {
      const token = localStorage.getItem('token');
      if (editingJob) {
        await axios.put(`http://localhost:5000/api/jobs/${editingJob._id || editingJob.id}`, jobData, {
          headers: { 'x-auth-token': token }
        });
        addToast('Job updated', 'success');
      } else {
        await axios.post('http://localhost:5000/api/jobs', jobData, {
          headers: { 'x-auth-token': token }
        });
        addToast('Job created', 'success');
      }
      setJobModalOpen(false);
      fetchJobsDirectly();
    } catch (err) {
      addToast('Failed to save job', 'error');
    }
  };

  // ===== Download, details, status =====
  const handleDownload = async (applicationId, fileName) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/applications/download/${applicationId}`, {
        headers: { 'x-auth-token': token },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || 'resume.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      addToast('Failed to download resume', 'error');
    }
  };

  const fetchApplicationDetail = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/applications/${id}`, {
        headers: { 'x-auth-token': token }
      });
      setSelectedApp(res.data);
    } catch (err) {
      addToast('Failed to load application details', 'error');
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/applications/${id}/status`, { status: newStatus }, {
        headers: { 'x-auth-token': token }
      });
      addToast(`Status updated to ${newStatus}`, 'success');
      fetchApplications();
    } catch (err) {
      addToast('Failed to update status', 'error');
    }
  };

  const handleApproveRequest = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/interviews/${id}`, { status: 'approved' }, {
        headers: { 'x-auth-token': token }
      });
      addToast('Interview approved', 'success');
      fetchPendingRequests();
    } catch (err) {
      addToast('Approval failed', 'error');
    }
  };

  const handleRejectRequest = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/interviews/${id}`, { status: 'rejected' }, {
        headers: { 'x-auth-token': token }
      });
      addToast('Interview rejected', 'success');
      fetchPendingRequests();
    } catch (err) {
      addToast('Rejection failed', 'error');
    }
  };

  // ===== User Management (admin) =====
  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/users/${userId}/role`, { role: newRole }, {
        headers: { 'x-auth-token': token }
      });
      addToast('User role updated', 'success');
      fetchUsers();
    } catch (err) {
      addToast('Failed to update role', 'error');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/users/${userId}`, {
        headers: { 'x-auth-token': token }
      });
      addToast('User deleted', 'success');
      fetchUsers();
    } catch (err) {
      addToast('Failed to delete user', 'error');
    }
  };

  const toggleMaintenance = async () => {
    try {
      const token = localStorage.getItem('token');
      const newState = !maintenanceToggle;
      await axios.put('http://localhost:5000/api/settings/maintenance', { maintenanceMode: newState }, {
        headers: { 'x-auth-token': token }
      });
      setMaintenanceToggle(newState);
      if (fetchMaintenanceStatus) fetchMaintenanceStatus();
      addToast(`Maintenance mode ${newState ? 'enabled' : 'disabled'}`, 'success');
    } catch (err) {
      addToast('Failed to update maintenance status', 'error');
    }
  };

  const getBarColor = (range) => {
    if (range === '81-100') return '#10B981';
    if (range === '61-80') return '#38BDF8';
    if (range === '41-60') return '#F59E0B';
    return '#F43F5E';
  };

  if (localJobsLoading) {
    return (
      <div className="app-shell">
        <div className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <div>Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <nav className="sidebar">
        <SidebarLogo />
        <div className="sidebar-menu">
          {nav.map((n, i) => {
            const Icon = n.icon;
            return (
              <div key={n.key}>
                {n.section && <span className="menu-label">{n.section}</span>}
                <div className={`menu-item ${page === n.key ? 'active' : ''}`} onClick={() => setPage(n.key)}>
                  <Icon size={17} /> {n.label}
                </div>
              </div>
            );
          })}
        </div>
        <div className="sidebar-bottom">
          <div className="user-mini">
            <Avatar name={userInfo.name} color={userInfo.color} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 500 }}>{userInfo.name}</div>
              <span className={`role-pill ${userInfo.rolePill}`} style={{ marginTop: 3, display: 'inline-block' }}>{userInfo.roleLabel}</span>
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            <div className="menu-item" style={{ padding: '0.4rem 0', fontSize: 12 }} onClick={() => setScreen('login')}>
              <LogOut size={15} /> Sign out
            </div>
          </div>
        </div>
      </nav>

      <div className="main-content">
        <div className="topbar">
          <span className="topbar-title">{pageTitle}</span>
          <div className="topbar-right">
            <span className={`role-pill ${userInfo.rolePill}`}>{userInfo.roleLabel}</span>
            <div className="icon-btn"><Bell size={15} /></div>
          </div>
        </div>

        <div className="page-body">
          {page === 'overview' && (
            <div>
              <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="kpi-card"><div className="kpi-label">Total Jobs</div><div className="kpi-value">{stats.totalJobs}</div><div className="kpi-sub">Active listings</div></div>
                <div className="kpi-card"><div className="kpi-label">Total Applications</div><div className="kpi-value">{stats.totalApplications}</div><div className="kpi-sub">Submitted</div></div>
                <div className="kpi-card accent"><div className="kpi-label">Average Match Score</div><div className="kpi-value accent">{stats.avgMatchScore}%</div><div className="kpi-sub">Across all candidates</div></div>
                <div className="kpi-card"><div className="kpi-label">Open Positions</div><div className="kpi-value">{localJobs.filter(j => j.status === 'active').length}</div><div className="kpi-sub">Awaiting applicants</div></div>
              </div>

              {scoreDistribution.length > 0 && (
                <div className="charts-row">
                  <div className="chart-card">
                    <div className="chart-title"><BarChart2 size={14} /> Match Score Distribution</div>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={scoreDistribution} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', color: '#F1F5F9' }} />
                        <Bar dataKey="count" radius={[4,4,0,0]}>
                          {scoreDistribution.map((entry, idx) => <Cell key={idx} fill={getBarColor(entry.range)} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="chart-card">
                    <div className="chart-title"><BarChart2 size={14} /> Applications Over Time</div>
                    {applicationsOverTime.length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={applicationsOverTime} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                          <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} allowDecimals={false} />
                          <Tooltip contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', color: '#F1F5F9' }} />
                          <Area type="monotone" dataKey="count" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text2)' }}>No application data yet</div>}
                  </div>
                </div>
              )}

              {stats.totalApplications === 0 && <div className="card" style={{ textAlign: 'center', marginBottom: '1rem' }}>No applications yet. Once candidates apply, statistics will appear here.</div>}

              <div className="section-header"><span className="section-title">Recent Applications</span><button className="btn sm" onClick={() => setPage('applications')}>View All</button></div>
              <div className="card card-flush">
                <table className="data-table">
                  <thead><tr><th>Candidate</th><th>Job</th><th>Match Score</th><th>Status</th><th>Applied</th><th>Actions</th></tr></thead>
                  <tbody>
                    {applications.slice(0, 5).map(app => (
                      <tr key={app._id}><td>{app.fullName}</td><td>{app.jobTitle}</td><td><ScoreBadge value={app.matchScore} /></td><td><StatusPill status={app.status} /></td><td>{new Date(app.appliedAt).toLocaleDateString()}</td><td><button className="btn sm" onClick={() => fetchApplicationDetail(app._id)}><Eye size={14} /> View</button></td></tr>
                    ))}
                    {applications.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center' }}>No applications yet</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {page === 'jobs' && (
            <div className="card card-flush">
              <div className="section-header">
                <span className="section-title">Job Listings</span>
                <div>
                  <button className="btn sm" onClick={fetchJobsDirectly} style={{ marginRight: '0.5rem' }}>Refresh</button>
                  <button className="btn primary sm" onClick={handleCreateJob}><Plus size={14} /> Create Job</button>
                </div>
              </div>
              {localJobs.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text2)' }}>
                  No jobs found. Create your first job!
                </div>
              ) : (
                <table className="data-table">
                  <thead><tr><th>Title</th><th>Department</th><th>Location</th><th>Required Skills</th><th>Experience</th><th>Status</th><th>Applicants</th><th>Actions</th></tr></thead>
                  <tbody>
                    {localJobs.map(job => {
                      const jobId = job._id || job.id;
                      const skills = job.requiredSkills || job.skills || [];
                      return (
                        <tr key={jobId}>
                          <td>{job.title || 'Untitled'}</td>
                          <td>{job.dept || '-'}</td>
                          <td>{job.location || '-'}</td>
                          <td><div className="tags">{skills.slice(0, 3).map(s => <span key={s} className="tag skill">{s}</span>)}{skills.length === 0 && <span className="tag">No skills listed</span>}</div></td>
                          <td>{job.experienceRequired || job.exp || '-'} yrs</td>
                          <td><StatusPill status={job.status || 'active'} /></td>
                          <td>{job.applicants !== undefined ? job.applicants : 0}</td>
                          <td><div className="table-actions"><button className="btn sm" onClick={() => handleEditJob(job)}><Edit3 size={13} /></button><button className="btn danger sm" onClick={() => handleDeleteJob(jobId)}><Trash2 size={13} /></button></div></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {page === 'applications' && (
            <div className="card card-flush">
              <div className="section-header"><span className="section-title">Candidate Applications</span><button className="btn sm" onClick={fetchApplications}>Refresh</button></div>
              {loading ? <div>Loading...</div> : (
                <table className="data-table">
                  <thead><tr><th>Candidate</th><th>Job</th><th>Match Score</th><th>Status</th><th>Applied</th><th>Actions</th></tr></thead>
                  <tbody>
                    {applications.map(app => (
                      <tr key={app._id}><td>{app.fullName}</td><td>{app.jobTitle}</td><td><ScoreBadge value={app.matchScore} /></td><td><StatusPill status={app.status} /></td><td>{new Date(app.appliedAt).toLocaleDateString()}</td><td>
                          <button className="btn sm" onClick={() => fetchApplicationDetail(app._id)}><Eye size={14} /> View</button>
                      </td></tr>
                    ))}
                    {applications.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center' }}>No applications yet</td></tr>}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {page === 'approvals' && (
            <div className="card">
              <div className="section-header"><span className="section-title">Pending Interview Requests</span><button className="btn sm" onClick={fetchPendingRequests}>Refresh</button></div>
              {loadingRequests && <div>Loading...</div>}
              {!loadingRequests && pendingRequests.length === 0 && <p>No pending requests.</p>}
              {pendingRequests.map(req => (
                <div key={req._id} className="approval-card" style={{ marginBottom: '1rem' }}>
                  <div className="approval-info">
                    <div className="approval-name">{req.candidate?.name} <span style={{ fontSize: 12, color: 'var(--text2)' }}>→ {req.jobTitle}</span></div>
                    <div className="approval-meta"><span>📅 {req.date}</span><span>🕐 {req.time}</span><span>👤 Recruiter: {req.recruiter?.name}</span></div>
                    {req.notes && <div className="approval-note">Note: {req.notes}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button className="btn success sm" onClick={() => handleApproveRequest(req._id)}><CheckCircle size={14} /> Approve</button>
                    <button className="btn danger sm" onClick={() => handleRejectRequest(req._id)}><XCircle size={14} /> Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {page === 'upload' && role !== 'admin' && (
            <div className="card">
              <h3>Bulk Resume Upload & Ranking</h3>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="field-label">Select Job</label>
                <select className="field-input" value={bulkJobId} onChange={e => setBulkJobId(e.target.value)}>
                  <option value="">-- Choose a job --</option>
                  {localJobs.map(job => <option key={job._id || job.id} value={job._id || job.id}>{job.title}</option>)}
                </select>
              </div>
              <div className="upload-zone" onClick={() => bulkFileInputRef.current.click()}>
                <Upload size={36} color="var(--text3)" />
                <p>Click or drag multiple resumes (PDF, DOCX, TXT)</p>
                <small>Max 20 files, 10MB each</small>
                <input ref={bulkFileInputRef} type="file" multiple accept=".pdf,.docx,.txt" style={{ display: 'none' }} onChange={(e) => setBulkFiles(Array.from(e.target.files))} />
              </div>
              {bulkFiles.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <strong>{bulkFiles.length} file(s) selected</strong>
                  <button className="btn primary sm" style={{ marginLeft: '1rem' }} onClick={async () => {
                    if (!bulkJobId) { addToast('Select a job first', 'error'); return; }
                    setBulkProcessing(true);
                    const formData = new FormData();
                    bulkFiles.forEach(f => formData.append('resumes', f));
                    formData.append('jobId', bulkJobId);
                    try {
                      const token = localStorage.getItem('token');
                      const res = await axios.post('http://localhost:5000/api/bulk/bulk', formData, { headers: { 'x-auth-token': token, 'Content-Type': 'multipart/form-data' } });
                      setRankedCandidates(res.data.rankedCandidates);
                      addToast('Ranking complete', 'success');
                    } catch (err) {
                      addToast(err.response?.data?.msg || 'Upload failed', 'error');
                    } finally {
                      setBulkProcessing(false);
                    }
                  }} disabled={bulkProcessing}>{bulkProcessing ? 'Processing...' : 'Upload & Rank'}</button>
                </div>
              )}
              {rankedCandidates.length > 0 && (
                <div style={{ marginTop: '2rem' }}>
                  <h4>Ranked Candidates (by match score)</h4>
                  <table className="data-table">
                    <thead><tr><th>Rank</th><th>Name</th><th>Email</th><th>Match Score</th><th>Skills</th><th>Matching</th><th>Missing</th></tr></thead>
                    <tbody>
                      {rankedCandidates.map((c, idx) => (
                        <tr key={idx}>
                          <td>{idx+1}</td>
                          <td>{c.extracted?.name || 'Unknown'}</td>
                          <td>{c.extracted?.email || '-'}</td>
                          <td><ScoreBadge value={c.matchScore} /></td>
                          <td>{(c.extracted?.skills || []).slice(0, 3).join(', ')}</td>
                          <td>{(c.matchingSkills || []).slice(0, 3).join(', ')}</td>
                          <td>{(c.missingSkills || []).slice(0, 3).join(', ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button className="btn sm" onClick={() => setRankedCandidates([])}>Clear</button>
                </div>
              )}
            </div>
          )}

          {page === 'users' && isAdmin && (
            <div className="card card-flush">
              <div className="section-header"><span className="section-title">User Management</span><button className="btn sm" onClick={fetchUsers}>Refresh</button></div>
              {userLoading && <div>Loading users...</div>}
              {userError && <div style={{ color: 'var(--rose)', padding: '1rem' }}>Error: {userError}</div>}
              {!userLoading && !userError && (
                <table className="data-table">
                  <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Actions</th></tr></thead>
                  <tbody>
                    {(users || []).length === 0 ? (
                      <tr><td colSpan="4" style={{ textAlign: 'center' }}>No users found.</td></tr>
                    ) : (
                      (users || []).map(user => (
                        <tr key={user._id}>
                          <td>{user.name}</td>
                          <td>{user.email}</td>
                          <td>
                            <select
                              className="field-input"
                              style={{ width: 'auto', padding: '4px 8px' }}
                              value={user.role}
                              onChange={(e) => handleUpdateUserRole(user._id, e.target.value)}
                              disabled={user.email === 'admin@boreas.com'}
                            >
                              <option value="candidate">Candidate</option>
                              <option value="hr">HR</option>
                              <option value="recruiter">Recruiter</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td>
                            <button
                              className="btn danger sm"
                              onClick={() => handleDeleteUser(user._id)}
                              disabled={user.email === 'admin@boreas.com'}
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {page === 'settings' && isAdmin && (
            <div className="card">
              <h3>System Settings</h3>
              <div className="toggle-wrap" style={{ marginBottom: '1rem' }}>
                <span style={{ fontSize: '14px', fontWeight: '500' }}>Maintenance Mode</span>
                <div className="toggle" onClick={toggleMaintenance}>
                  <div className={`toggle-thumb ${maintenanceToggle ? '' : 'off'}`} />
                </div>
              </div>
              <p style={{ color: 'var(--text2)', fontSize: '13px' }}>
                {maintenanceToggle ? '⚠️ System is locked for all non-admin users.' : '🔓 System is open to all users.'}
              </p>
              <div className="divider" />
              <p style={{ color: 'var(--text3)', fontSize: '12px' }}>Additional settings will be added here in the future.</p>
            </div>
          )}
        </div>
      </div>

      {jobModalOpen && (
        <Modal
          title={editingJob ? 'Edit Job' : 'Create New Job'}
          onClose={() => setJobModalOpen(false)}
          footer={
            <>
              <button className="btn sm" onClick={() => setJobModalOpen(false)}>Cancel</button>
              <button className="btn primary sm" onClick={saveJob}>{editingJob ? 'Update Job' : 'Create Job'}</button>
            </>
          }
        >
          <div className="form-grid">
            <div className="full"><label className="field-label">Job Title *</label><input className="field-input" value={jobForm.title} onChange={e => setJobForm({ ...jobForm, title: e.target.value })} placeholder="e.g., Senior Frontend Engineer" /></div>
            <div><label className="field-label">Department</label><input className="field-input" value={jobForm.dept} onChange={e => setJobForm({ ...jobForm, dept: e.target.value })} placeholder="Engineering" /></div>
            <div><label className="field-label">Location</label><input className="field-input" value={jobForm.location} onChange={e => setJobForm({ ...jobForm, location: e.target.value })} placeholder="Remote / Hybrid / On-site" /></div>
            <div><label className="field-label">Experience Required (years)</label><input className="field-input" value={jobForm.experienceRequired} onChange={e => setJobForm({ ...jobForm, experienceRequired: e.target.value })} placeholder="3+" /></div>
            <div><label className="field-label">Status</label><select className="field-input" value={jobForm.status} onChange={e => setJobForm({ ...jobForm, status: e.target.value })}><option value="active">Active</option><option value="draft">Draft</option><option value="closed">Closed</option></select></div>
            <div className="full"><label className="field-label">Required Skills (press Enter to add)</label><div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '6px 10px', minHeight: 42, display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>{jobForm.requiredSkills.map(s => <span key={s} className="tag skill" style={{ cursor: 'pointer' }} onClick={() => removeSkill(s)}>{s} ×</span>)}<input style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 13, minWidth: 80 }} placeholder="Type a skill…" value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={addSkill} /></div></div>
            <div className="full"><label className="field-label">Description</label><textarea className="field-input" rows={3} value={jobForm.description} onChange={e => setJobForm({ ...jobForm, description: e.target.value })} placeholder="Job description, responsibilities, benefits..." /></div>
          </div>
        </Modal>
      )}

      {selectedApp && (
        <Modal
          title="Application Details"
          onClose={() => setSelectedApp(null)}
          footer={
            <>
              <button className="btn sm" onClick={() => setSelectedApp(null)}>Close</button>
              {selectedApp.resumeFilePath && (
                <button className="btn primary sm" onClick={() => handleDownload(selectedApp._id, `${selectedApp.fullName}_resume.pdf`)}>
                  <Download size={14} /> Download Resume
                </button>
              )}
              <button className="btn sm" onClick={() => fetchCandidateProfile(selectedApp.candidate?._id)}>
                View Full Profile
              </button>
              <select
                className="field-input"
                style={{ width: 'auto' }}
                value={selectedApp.status}
                onChange={(e) => handleUpdateStatus(selectedApp._id, e.target.value)}
              >
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="rejected">Rejected</option>
              </select>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div><strong>Candidate:</strong> {selectedApp.fullName}</div>
            <div><strong>Email:</strong> {selectedApp.email}</div>
            <div><strong>Phone:</strong> {selectedApp.phone || 'N/A'}</div>
            <div><strong>Job Applied:</strong> {selectedApp.jobTitle}</div>
            <div><strong>Experience:</strong> {selectedApp.experience} years</div>
            <div><strong>Education:</strong> {selectedApp.education || 'N/A'}</div>
            <div><strong>Match Score:</strong> <ScoreBadge value={selectedApp.matchScore} /></div>
            <div><strong>Skills Score:</strong> {selectedApp.skillsScore}%</div>
            <div><strong>Experience Score:</strong> {selectedApp.experienceScore}%</div>
            <div><strong>Education Score:</strong> {selectedApp.educationScore}%</div>
            <div><strong>Matching Skills:</strong> <div className="tags">{selectedApp.matchingSkills?.map(s => <span key={s} className="tag skill">{s}</span>)}</div></div>
            <div><strong>Missing Skills:</strong> <div className="tags">{selectedApp.missingSkills?.map(s => <span key={s} className="tag missing">{s}</span>)}</div></div>
            <div><strong>All Skills (resume):</strong> <div className="tags">{selectedApp.skills?.map(s => <span key={s} className="tag skill">{s}</span>)}</div></div>
            <div><strong>Resume Preview:</strong><pre style={{ background: 'var(--surface2)', padding: '0.5rem', borderRadius: '6px', maxHeight: '200px', overflow: 'auto', fontSize: '12px' }}>{selectedApp.resumeText?.substring(0, 1000)}...</pre></div>
          </div>
        </Modal>
      )}

      {profileModalOpen && candidateProfile && (
        <Modal
          title="Candidate Profile"
          onClose={() => {
            setProfileModalOpen(false);
            setCandidateProfile(null);
          }}
          footer={
            <button className="btn sm" onClick={() => {
              setProfileModalOpen(false);
              setCandidateProfile(null);
            }}>Close</button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <div><strong>Name:</strong> {candidateProfile.name}</div>
            <div><strong>Email:</strong> {candidateProfile.email}</div>
            <div><strong>Phone:</strong> {candidateProfile.phone || 'N/A'}</div>
            <div><strong>Experience:</strong> {candidateProfile.experience || 'N/A'} years</div>
            <div><strong>Education:</strong> {candidateProfile.education || 'N/A'}</div>
            <div>
              <strong>Skills:</strong>
              <div className="tags">
                {(candidateProfile.skills || []).map(s => <span key={s} className="tag skill">{s}</span>)}
              </div>
            </div>
            <div><strong>Role:</strong> {candidateProfile.role}</div>
          </div>
        </Modal>
      )}
    </div>
  );
}