// src/services/emergencyService.js
// Handles emergency contacts and SMS notifications

import * as SMS from 'expo-sms';

// ── Get user's emergency contacts from backend ────────────────────────────
export async function getEmergencyContacts(userId, backendUrl = "http://192.168.29.170:5000") {
  try {
    const res = await fetch(`${backendUrl}/emergency-contacts/${userId}`);
    if (!res.ok) {
      console.warn("[Emergency] No contacts found:", res.status);
      return [];
    }
    const data = await res.json();
    console.log("[Emergency] Fetched contacts:", data.contacts?.length ?? 0);
    return data.contacts || [];
  } catch (e) {
    console.warn("[Emergency] Fetch failed:", e.message);
    return [];
  }
}

// ── Save emergency contacts ────────────────────────────────────────────────
export async function saveEmergencyContact(userId, contact, backendUrl = "http://192.168.29.170:5000") {
  try {
    const res = await fetch(`${backendUrl}/emergency-contacts/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contact),
    });
    if (!res.ok) throw new Error(`${res.status}`);
    console.log("[Emergency] Contact saved:", contact.name);
    return true;
  } catch (e) {
    console.error("[Emergency] Save failed:", e.message);
    return false;
  }
}

// ── Delete emergency contact ────────────────────────────────────────────────
export async function deleteEmergencyContact(userId, contactId, backendUrl = "http://192.168.29.170:5000") {
  try {
    const res = await fetch(`${backendUrl}/emergency-contacts/${userId}/${contactId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error(`${res.status}`);
    console.log("[Emergency] Contact deleted");
    return true;
  } catch (e) {
    console.error("[Emergency] Delete failed:", e.message);
    return false;
  }
}

// ── Send SOS SMS to emergency contacts ────────────────────────────────────
export async function sendSOSAlert(userId, userLocation, alertDetails) {
  try {
    // Check if SMS is available
    const available = await SMS.isAvailableAsync();
    if (!available) {
      console.warn("[Emergency] SMS not available on this device");
      return { sent: 0, failed: 0, reason: "SMS unavailable" };
    }

    // Get emergency contacts
    const contacts = await getEmergencyContacts(userId);
    if (!contacts || contacts.length === 0) {
      console.warn("[Emergency] No emergency contacts saved");
      return { sent: 0, failed: 0, reason: "No contacts" };
    }

    // Build SOS message
    const message = buildSOSMessage(userLocation, alertDetails);
    const phoneNumbers = contacts.map((c) => c.phone).filter(Boolean);

    if (phoneNumbers.length === 0) {
      console.warn("[Emergency] No valid phone numbers");
      return { sent: 0, failed: 0, reason: "No valid phones" };
    }

    console.log(`[Emergency] Sending SOS to ${phoneNumbers.length} contacts...`);

    // Send SMS
    await SMS.sendSMSAsync(phoneNumbers, message);

    console.log("[Emergency] ✅ SOS sent to", phoneNumbers.length, "contacts");
    return { sent: phoneNumbers.length, failed: 0, message };
  } catch (e) {
    console.error("[Emergency] SOS failed:", e.message);
    return { sent: 0, failed: 1, error: e.message };
  }
}

// ── Build the SOS message ──────────────────────────────────────────────────
function buildSOSMessage(userLocation, alertDetails) {
  const timestamp = new Date().toLocaleTimeString();
  const date = new Date().toLocaleDateString();

  return `🚨 EMERGENCY ALERT 🚨

Vital: ${alertDetails.vital}
Severity: ${alertDetails.severity?.toUpperCase()}
Time: ${timestamp} on ${date}

Location: ${userLocation ? `${userLocation.latitude}, ${userLocation.longitude}` : "Location unknown"}

Please check on me or call emergency services if needed.

Sent by VitalSync Health Monitor`;
}

// ── Call emergency (911 in US, adjust for your country) ──────────────────
export async function callEmergency() {
  try {
    const emergencyNumber = "911"; // Change for your country (112 in EU, 999 in UK, etc.)
    // Note: Can't directly call, but can open dialer
    // You'll need linking library to open phone dialer
    console.log("[Emergency] Opening emergency dialer for", emergencyNumber);
    // Implementation depends on your setup
  } catch (e) {
    console.error("[Emergency] Call failed:", e.message);
  }
}