import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000/api';
const AppContext = createContext(null);

export function AppProvider({ children }) {
  // ----- Core State -----
  const [screen, setScreen] = useState('login');
  const [role, setRole] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [currentCandidate, setCurrentCandidate] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [users, setUsers] = useState([]);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // ----- Axios defaults -----
  if (token) {
    axios.defaults.headers.common['x-auth-token'] = token;
  }

  // ----- Toast -----
  const addToast = useCallback((msg, type = 'success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  // ----- Fetch Jobs (all, for HR and candidate) -----
  const fetchJobs = async () => {
    try {
      const res = await axios.get(`${API}/jobs?all=true`);
      setJobs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch jobs', err);
      setJobs([]);
    }
  };

  // ----- Maintenance Status -----
  const fetchMaintenanceStatus = async () => {
    try {
      const res = await axios.get(`${API}/settings/maintenance`);
      setMaintenanceMode(res.data.maintenanceMode);
    } catch (err) {
      console.error('Failed to fetch maintenance status', err);
    }
  };

  // ----- Auth -----
  const loginCandidate = async (email, password) => {
    try {
      const res = await axios.post(`${API}/auth/login`, { email, password });
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      setToken(token);
      axios.defaults.headers.common['x-auth-token'] = token;
      setCurrentCandidate(user);
      setRole(user.role);
      // ✅ Fetch jobs after login
      await fetchJobs();
      await fetchMaintenanceStatus();
      return true;
    } catch (err) {
      addToast(err.response?.data?.msg || 'Login failed', 'error');
      return false;
    }
  };

  const signupCandidate = async (userData) => {
    try {
      const res = await axios.post(`${API}/auth/signup`, userData);
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      setToken(token);
      axios.defaults.headers.common['x-auth-token'] = token;
      setCurrentCandidate(user);
      setRole(user.role);
      // ✅ Fetch jobs after signup
      await fetchJobs();
      await fetchMaintenanceStatus();
      return true;
    } catch (err) {
      addToast(err.response?.data?.msg || 'Signup failed', 'error');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setCurrentCandidate(null);
    setRole(null);
    setScreen('login');
    delete axios.defaults.headers.common['x-auth-token'];
    addToast('Logged out successfully', 'success');
  };

  // ----- Refresh Profile -----
  const refreshProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await axios.get(`${API}/auth/me`, {
        headers: { 'x-auth-token': token }
      });
      setCurrentCandidate(res.data);
    } catch (err) {
      console.error('Failed to refresh profile', err);
    }
  };

  // ----- Initial load -----
  useEffect(() => {
    fetchJobs();
    fetchMaintenanceStatus();
  }, []);

  return (
    <AppContext.Provider value={{
      screen, setScreen,
      role, setRole,
      toasts, addToast,
      jobs, setJobs,
      users, setUsers,
      currentCandidate,
      maintenanceMode, setMaintenanceMode,
      loginCandidate,
      signupCandidate,
      logout,
      fetchJobs,
      fetchMaintenanceStatus,
      refreshProfile,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);