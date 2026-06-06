import { useAuthStore } from "../store/authStore";

const BASE_URL = "http://192.168.1.5:5000";

export const getDevices = async (userId) => {
  const res = await fetch(`${BASE_URL}/devices/${userId}`);

  const text = await res.text();
  if (text.startsWith("<")) {
    throw new Error("Wrong API route");
  }

  return JSON.parse(text);
};

export const updateDevice = async (id, data) => {
  console.log("✏️ Updating device:", id, data);

  const res = await fetch(`${BASE_URL}/devices/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const text = await res.text();
  console.log("📦 UPDATE RAW:", text);

  if (text.startsWith("<")) {
    throw new Error("Wrong API route (HTML returned)");
  }

  return JSON.parse(text);
};
export const createDevice = async (data) => {
  console.log("🚀 Creating device:", data);

  const res = await fetch(`${BASE_URL}/devices`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const text = await res.text();
  console.log("📦 CREATE DEVICE RAW:", text);

  if (text.startsWith("<")) {
    throw new Error("Server returned HTML (wrong endpoint)");
  }

  return JSON.parse(text);
};

