import { AppProvider, useApp } from './context/AppContext';
import LoginScreen from './LoginScreen';
import CandidateDashboard from './pages/candidate/CandidateDashboard';
import HRDashboard from './pages/recruiter/HRDashboard';
import RecruiterDashboard from './pages/recruiter/RecruiterDashboard';
import { Toast } from './components/UI';

function AppContent() {
  const { screen, maintenanceMode, role } = useApp();

  // If maintenance mode is ON and user is NOT admin, show maintenance page
  if (maintenanceMode && role !== 'admin') {
    return (
      <div className="maintenance-page">
        <div className="maintenance-card">
          <h1>🔧 System Maintenance</h1>
          <p>The system is currently undergoing maintenance.</p>
          <p>Please check back later.</p>
          <p style={{ marginTop: '1rem', fontSize: '13px', color: 'var(--text3)' }}>
            We apologize for the inconvenience.
          </p>
        </div>
      </div>
    );
  }

  // Normal routing based on screen state
  return (
    <>
      {screen === 'login' && <LoginScreen />}
      {screen === 'candidate' && <CandidateDashboard />}
      {screen === 'hr' && <HRDashboard />}
      {screen === 'recruiter' && <RecruiterDashboard />}
      <Toast />
    </>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;