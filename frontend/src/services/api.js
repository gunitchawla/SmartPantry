import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://192.168.56.11:5000",
  headers: {
    "Cache-Control": "no-cache",
  },
});

export default api;