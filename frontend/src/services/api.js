import axios from "axios";

// Override with a .env file (VITE_API_URL=http://localhost:5000) for local dev.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://192.168.56.11:5000",
});

export default api;
