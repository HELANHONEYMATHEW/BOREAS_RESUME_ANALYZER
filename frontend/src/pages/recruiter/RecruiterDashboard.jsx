import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { SidebarLogo, Modal, ScoreBadge, StatusPill, Avatar } from '../../components/UI';
import { Users, Calendar, LogOut, Bell, Eye, Download, CalendarPlus } from 'lucide-react';
import axios from 'axios';
import ScheduleModal from '../../components/ScheduleModal';

const NAV = [
  { key: 'applications', label: 'Candidate Applications', icon: Users },
  { key: 'requests', label: 'My Requests', icon: Calendar },
];

export default function RecruiterDashboard() {
  const { setScreen, addToast } = useApp();
  const [page, setPage] = useState('applications');
  const [applications, setApplications] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [scheduleCandidate, setScheduleCandidate] = useState(null);
  const [scheduleApplicationId, setScheduleApplicationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Profile modal
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [candidateProfile, setCandidateProfile] = useState(null);

  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      const res = await axios.get('http://localhost:5000/api/applications', {
        headers: { 'x-auth-token': token }
      });
      setApplications(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.msg || err.message);
      addToast('Failed to load applications', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/interviews/my-requests', {
        headers: { 'x-auth-token': token }
      });
      setMyRequests(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (page === 'applications') fetchApplications();
    if (page === 'requests') fetchMyRequests();
  }, [page]);

  const handleRequestInterview = (app) => {
    setScheduleApplicationId(app._id);
    setScheduleCandidate({ name: app.fullName, job: app.jobTitle });
  };

  const handleScheduleSubmit = async ({ candidate, date, time, notes }) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/interviews', {
        applicationId: scheduleApplicationId,
        date,
        time,
        notes
      }, { headers: { 'x-auth-token': token } });
      addToast('Interview request sent to HR', 'success');
      setScheduleCandidate(null);
      setScheduleApplicationId(null);
      fetchApplications();
    } catch (err) {
      console.error('Submit error:', err);
      addToast(err.response?.data?.msg || 'Failed to send request', 'error');
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
      addToast('Failed to load details', 'error');
    }
  };

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

  return (
    <div className="app-shell">
      <nav className="sidebar">
        <SidebarLogo />
        <div className="sidebar-menu">
          <span className="menu-label">Recruiter</span>
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
            <Avatar name="RECRUITER@BOREAS" color="var(--emerald)" />
            <div>
              <div style={{ fontSize: 12, fontWeight: 500 }}>RECRUITER</div>
              <span className="role-pill recruiter">Recruiter</span>
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
          <span className="topbar-title">
            {page === 'applications' ? 'Candidate Applications' : 'My Interview Requests'}
          </span>
          <div className="topbar-right">
            <span className="role-pill recruiter">Recruiter</span>
            <div className="icon-btn"><Bell size={15} /></div>
          </div>
        </div>

        <div className="page-body">
          {page === 'applications' && (
            <div className="card card-flush">
              <div className="section-header">
                <span className="section-title">All Applications</span>
                <button className="btn sm" onClick={fetchApplications}>Refresh</button>
              </div>
              {loading && <div>Loading...</div>}
              {error && <div className="error" style={{ color: 'var(--rose)', padding: '1rem' }}>Error: {error}</div>}
              {!loading && !error && (
                <table className="data-table">
                  <thead>
                    <tr><th>Candidate</th><th>Job</th><th>Match Score</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {applications.map(app => (
                      <tr key={app._id}>
                        <td>{app.fullName}</td>
                        <td>{app.jobTitle}</td>
                        <td><ScoreBadge value={app.matchScore} /></td>
                        <td><StatusPill status={app.status} /></td>
                        <td>
                          <div className="table-actions">
                            <button className="btn sm" onClick={() => fetchApplicationDetail(app._id)}><Eye size={14} /> View</button>
                            <button className="btn primary sm" onClick={() => handleRequestInterview(app)}><CalendarPlus size={14} /> Request Interview</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {applications.length === 0 && <tr><td colSpan="5">No applications yet</td></tr>}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {page === 'requests' && (
            <div className="card">
              <h3>My Interview Requests</h3>
              {myRequests.length === 0 ? <p>No requests yet.</p> : (
                myRequests.map(req => (
                  <div key={req._id} className="approval-card" style={{ marginBottom: '1rem' }}>
                    <div><strong>{req.candidate?.name}</strong> for {req.jobTitle}</div>
                    <div>Date: {req.date} at {req.time}</div>
                    <div>Notes: {req.notes || 'None'}</div>
                    <div>Status: <StatusPill status={req.status} /></div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

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
              <button className="btn primary sm" onClick={() => addToast('Interview scheduling coming soon', 'info')}>
                Schedule Interview
              </button>
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
            <details>
              <summary>Resume Preview</summary>
              <pre style={{ background: 'var(--surface2)', padding: '0.5rem', borderRadius: '6px', maxHeight: '200px', overflow: 'auto', fontSize: '12px' }}>
                {selectedApp.resumeText?.substring(0, 1500)}...
              </pre>
            </details>
          </div>
        </Modal>
      )}

      {scheduleCandidate && (
        <ScheduleModal
          candidate={scheduleCandidate}
          onClose={() => { setScheduleCandidate(null); setScheduleApplicationId(null); }}
          onSubmit={handleScheduleSubmit}
        />
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