import axios from "axios";

// Determine API base URL:
// 1. Local Vite dev server (port 5173): connect to http://localhost:5000
// 2. Production (port 80 via Nginx): use relative '/api' reverse-proxied internally
const getBaseURL = () => {
  if (typeof window !== "undefined" && window.location.port === "5173") {
    return import.meta.env.VITE_API_URL || "http://localhost:5000";
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