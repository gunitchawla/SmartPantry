import axios from "axios";

// Determine API base URL:
// 1. Environment variable if set (VITE_API_URL)
// 2. Localhost fallback in Vite dev mode
// 3. Relative reverse-proxy '/api' when served via Nginx in production
const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== "undefined" && window.location.port === "5173") {
    return "http://localhost:5000";
  }
  return "/api";
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    "Cache-Control": "no-cache",
  },
});

export default api;