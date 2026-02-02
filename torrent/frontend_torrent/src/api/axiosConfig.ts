import axios from 'axios';

// Matches your Nginx /api/ proxy setup
export const API_URL = '/api';

export const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' }
});