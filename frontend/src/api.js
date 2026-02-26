import axios from "axios";

// In development: uses http://localhost:5000
// In production: uses your Render backend URL (set VITE_API_URL in Vercel env vars)
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://face-attendance-backend.onrender.com/api",
});

export default API;