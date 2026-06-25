import axios from 'axios';

const API_URL = 'http://localhost:5000/api/upload';

export const parseResume = async (file) => {
  const formData = new FormData();
  formData.append('resume', file);
  
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_URL}/resume`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'x-auth-token': token
      },
      timeout: 30000 // 30 seconds timeout for large files
    });
    return response.data;
  } catch (error) {
    console.error('Resume parsing error:', error);
    throw error.response?.data || { error: 'Failed to parse resume' };
  }
};