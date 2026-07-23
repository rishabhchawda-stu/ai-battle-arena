import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Automatically attach token to every request if user is logged in
API.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem("userInfo"));
  if (user && user.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

export default API;