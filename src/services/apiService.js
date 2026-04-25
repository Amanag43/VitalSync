const BASE_URL = "http://192.168.1.11:5000";

// 🔥 Generic safe fetch handler
const safeFetch = async (url, options = {}) => {
  try {
    console.log("🌐 API CALL →", url);

    const res = await fetch(url, options);

    const text = await res.text(); // read raw response first

    console.log("📦 RAW RESPONSE →", text);

    // ❌ If server returned HTML (your current issue)
    if (text.startsWith("<")) {
      throw new Error("Server returned HTML instead of JSON");
    }

    const data = JSON.parse(text);

    if (!res.ok) {
      throw new Error(data?.error || "Request failed");
    }

    return data;

  } catch (err) {
    console.log("❌ API ERROR:", err.message);
    throw err;
  }
};

// ============================
// DEVICES
// ============================

export const getDevices = async (userId) => {
  return await safeFetch(`${BASE_URL}/devices/${userId}`);
};

export const deleteDevice = async (deviceId) => {
  return await safeFetch(`${BASE_URL}/devices/${deviceId}`, {
    method: "DELETE",
  });
};

// ============================
// ALERTS
// ============================

export const getAlerts = async (userId) => {
  return await safeFetch(`${BASE_URL}/alerts/${userId}`);
};

export const createAlert = async (data) => {
  return await safeFetch(`${BASE_URL}/alerts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
};

// ============================
// VITALS
// ============================

export const sendVitals = async (data) => {
  return await safeFetch(`${BASE_URL}/vitals`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
};

export const getVitalsHistory = async (userId) => {
  return await safeFetch(`${BASE_URL}/vitals/${userId}`);
};