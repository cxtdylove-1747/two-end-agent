import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || '';

const client = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function chatWithCoach(payload) {
  const { data } = await client.post('/api/chat', payload);
  return data;
}

export async function getProjects() {
  const { data } = await client.get('/api/projects');
  return data;
}

export async function getClassOverview() {
  const { data } = await client.get('/api/class_overview');
  return data;
}
