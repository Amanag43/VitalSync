export const sendVitals = async (data) => {
  try {
    await fetch("http://YOUR_IP:5000/api", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  } catch (err) {
    console.log("API error:", err);
  }
};
