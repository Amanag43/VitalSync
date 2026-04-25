import { useAuthStore } from "../store/authStore";

const BASE_URL = "http://YOUR_IP:5000/api/devices";

export const getDevices = async () => {
  const userId = useAuthStore.getState().getUserId();
  const res = await fetch(`${BASE_URL}/${userId}`);
  return res.json();
};

export const updateDevice = async (id, data) => {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};
export const createDevice = async (data) => {
  const userId = useAuthStore.getState().getUserId();

  const res = await fetch(`${BASE_URL}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId,
      ...data,
    }),
  });

  return res.json();
};