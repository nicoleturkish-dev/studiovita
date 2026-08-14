import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("sv_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const CATEGORY_LABELS = {
  egyeni: "Egyéni támogatás",
  gyermek: "Gyermekeknek",
  kapcsolat: "Kapcsolatok",
  csoport: "Csoportok",
  program: "Programok",
};

export const CATEGORY_ORDER = ["egyeni", "gyermek", "kapcsolat", "csoport", "program"];
