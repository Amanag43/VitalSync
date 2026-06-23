# VitalSync - IoT Health Monitoring & Emergency Alert System

> Real-time health monitoring with intelligent alerts, hospital locator, and emergency contact notifications.

[![React Native](https://img.shields.io/badge/React%20Native-0.74-blue)](https://reactnative.dev)
[![Expo](https://img.shields.io/badge/Expo-Latest-black)](https://expo.dev)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Latest-green)](https://www.mongodb.com)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Data Flow](#data-flow)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Running the App](#running-the-app)
- [Running the Backend](#running-the-backend)
- [API Endpoints](#api-endpoints)
- [Components & Services](#components--services)
- [Configuration](#configuration)
- [Testing](#testing)
- [Future Roadmap](#future-roadmap)
- [Contributing](#contributing)

---

## 🎯 Overview

**VitalSync** is a comprehensive health monitoring application designed for continuous vital sign tracking with intelligent alerts. When abnormal vitals are detected, the system:

1. **Displays a visual SOS banner** on the current screen
2. **Automatically navigates to a map** showing nearby hospitals
3. **Sends SMS alerts** to emergency contacts with location and vital details
4. **Syncs data to backend** for persistent health records
5. **Enables emergency call capabilities** directly from the app

Perfect for patients with chronic conditions, elderly monitoring, or high-risk individuals who need instant emergency response.

---

## ✨ Features

### 🏥 Core Health Monitoring
- ✅ **Real-time vital monitoring** (Heart Rate, SpO2, Temperature, Respiration)
- ✅ **Customizable threshold alerts** (Normal, Warning, Critical)
- ✅ **Mock vitals system** for testing without hardware
- ✅ **WebSocket real-time updates** from backend
- ✅ **Persistent health data** in MongoDB

### 🚨 Emergency System
- ✅ **Red SOS banner** appears instantly on abnormal vitals
- ✅ **Critical alert SMS** sent to emergency contacts
- ✅ **Automatic hospital locator** on alert trigger
- ✅ **ETA calculation** to nearest hospital
- ✅ **Direct emergency call** integration

### 🗺️ Location & Hospital Services
- ✅ **Mapbox integration** for real-time map display
- ✅ **Hospital finder** using Foursquare API (fallback: static database)
- ✅ **Route calculation** via OSRM routing engine
- ✅ **User location tracking** with GPS
- ✅ **Hospital details** (address, distance, drive time)

### 👥 Emergency Contacts
- ✅ **Manage emergency contacts** (add/delete/update)
- ✅ **SMS notifications** to all contacts on critical alert
- ✅ **Test SMS system** before emergency
- ✅ **Contact relationship tracking** (mother, friend, doctor, etc.)

### 📊 Backend & Data
- ✅ **RESTful API** for vitals, devices, alerts
- ✅ **WebSocket server** for real-time alerts
- ✅ **MongoDB storage** with TTL indices
- ✅ **Device management** (multiple IoT jackets per user)
- ✅ **Alert history** with timestamps and severity

---

## 🏗️ Architecture

### High-Level System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         VITALSYNC ECOSYSTEM                           │
└──────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                    MOBILE APP (React Native + Expo)                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ Mock Vitals Engine (alertEngine.js)                             │ │
│  │ └─ Generates realistic vital signs every 15 seconds             │ │
│  │ └─ heartRate: 70-85 bpm                                         │ │
│  │ └─ spo2: 95-100%                                                │ │
│  │ └─ temperature: 36.8°C                                          │ │
│  │ └─ respiratoryRate: 14-18 breaths/min                           │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                           ↓                                            │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ Vitals Store (vitalsStore.js)                                   │ │
│  │ └─ Central state management (Zustand)                           │ │
│  │ └─ Threshold checking (THRESHOLDS object)                       │ │
│  │ └─ Alert generation (severity: warning/critical)                │ │
│  │ └─ Backend sync (POST /vitals)                                  │ │
│  │ └─ WebSocket listener (incoming alerts from server)             │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                           ↓                                            │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ ON ALERT TRIGGERED:                                             │ │
│  │ 1. AlertBanner Component (shows red SOS)                        │ │
│  │ 2. emergencyService.js (sends SMS to contacts)                  │ │
│  │ 3. Router (navigates to map screen)                             │ │
│  │ 4. map.jsx (displays hospitals + directions)                    │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
              ↕ HTTP REST API        ↕ WebSocket (Real-time)
              POST /vitals           ws://server:5000/ws
┌─────────────────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js + Express)                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ REST API Routes                                                  │ │
│  │ ├─ POST /vitals (receive vital readings)                        │ │
│  │ ├─ GET /vitals/:userId (fetch user vitals history)              │ │
│  │ ├─ POST /emergency-contacts/:userId (add contact)               │ │
│  │ ├─ DELETE /emergency-contacts/:userId/:contactId (remove)       │ │
│  │ └─ GET /devices/:userId (user devices)                          │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                           ↓                                            │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ Alert Engine (server-side threshold check)                      │ │
│  │ └─ Validates vitals against THRESHOLDS                          │ │
│  │ └─ Determines severity (warning/critical)                       │ │
│  │ └─ Triggers WebSocket push to app                               │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                           ↓                                            │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ WebSocket Server (Real-time Communication)                      │ │
│  │ └─ Maintains connections per userId                             │ │
│  │ └─ Broadcasts VITAL_ALERT messages                              │ │
│  │ └─ Sends VITALS_UPDATE for changed readings                     │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                           ↓                                            │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ MongoDB Database                                                 │ │
│  │ ├─ vitals (readings with TTL: 90 days)                          │ │
│  │ ├─ alerts (critical events)                                     │ │
│  │ ├─ users (authentication & profiles)                            │ │
│  │ ├─ devices (IoT jacket metadata)                                │ │
│  │ └─ emergencyContacts (per user)                                 │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Complete Data Flow

### Scenario: Normal Vital Reading

```
TIME: 15:30:00
┌─────────────────────────────────────────────────────────────────────┐
│ alertEngine.js (Mobile)                                             │
│ └─ poll() function fires every 15 seconds                           │
│    └─ Generates mock vitals: { heartRate: 72, spo2: 97 }          │
└────────────────────────┬────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────────┐
│ vitalsStore.js                                                      │
│ └─ updateVitals(vitals)                                            │
│    └─ checkThresholds({ heartRate: 72, spo2: 97 })                │
│       └─ 72 < 130? ✅ YES (within range)                           │
│       └─ 97 in [92-100]? ✅ YES (within range)                     │
│       └─ Return: null (no alert)                                   │
│    └─ activeAlert = null                                           │
│    └─ syncToBackend(vitals, "normal")                              │
└────────────────────────┬────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Backend POST /vitals                                                │
│ Payload:                                                            │
│ {                                                                   │
│   userId: "984xeP9zK4NpAkoy0psmVA5U9lD3",                          │
│   timestamp: "2026-06-23T15:30:00Z",                               │
│   vitals: { heartRate: 72, spo2: 97 },                             │
│   severity: "normal",                                              │
│   deviceType: "phone_sensors"                                      │
│ }                                                                   │
└────────────────────────┬────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Backend Processing                                                  │
│ 1. Save to MongoDB (vitals collection)                             │
│ 2. Server-side threshold check: NORMAL ✅                          │
│ 3. No alert needed                                                 │
│ 4. Response: { ok: true, id: "...", alerts: [] }                   │
└────────────────────────┬────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Mobile App                                                          │
│ └─ [VitalsStore] ✅ Synced to backend                              │
│    └─ lastSync = "2026-06-23T15:30:00Z"                            │
│    └─ syncing = false                                              │
│                                                                     │
│ RESULT: User sees normal state, no alerts                          │
└─────────────────────────────────────────────────────────────────────┘
```

### Scenario: Critical Alert Triggered

```
TIME: 15:45:00
┌─────────────────────────────────────────────────────────────────────┐
│ User Action: Taps "Inject CRITICAL" button (for testing)            │
│ └─ vitalsStore.updateVitals({ heartRate: 155, spo2: 88 })         │
└────────────────────────┬────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────────┐
│ vitalsStore.js - checkThresholds()                                  │
│ └─ heartRate: 155 > 130? ❌ YES (OUTSIDE RANGE)                    │
│    └─ percentAboveMax = 155 - 130 = 25                             │
│    └─ 25 > 130 * 0.15 (19.5)? ❌ YES → CRITICAL                    │
│ └─ Alert generated:                                                │
│    {                                                               │
│      vital: "Heart Rate: 155 bpm",                                │
│      value: 155,                                                  │
│      unit: "bpm",                                                 │
│      severity: "critical",                                        │
│      timestamp: "2026-06-23T15:45:00Z"                            │
│    }                                                              │
└────────────────────────┬────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 1: Visual Alert                                               │
│ └─ set({ activeAlert: alert })                                    │
│    └─ AlertBanner component re-renders                            │
│    └─ 🚨 RED SOS BANNER APPEARS ON SCREEN                         │
│       "🚨 CRITICAL ALERT"                                         │
│       "Heart Rate: 155 bpm"                                       │
│       "Tap to view hospitals & get help →"                        │
└────────────────────────┬────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 2: Send SOS to Emergency Contacts                             │
│ └─ emergencyService.sendSOSAlert(userId, null, alert)             │
│    └─ getEmergencyContacts(userId)                                │
│       └─ Backend GET /emergency-contacts/userId                  │
│       └─ Returns: [{ name: "Mom", phone: "+1234567890" }, ...]   │
│    └─ buildSOSMessage():                                          │
│       "🚨 EMERGENCY ALERT 🚨"                                     │
│       "Vital: Heart Rate: 155 bpm"                                │
│       "Severity: CRITICAL"                                        │
│       "Time: 15:45 on 06-23-2026"                                 │
│       "Location: [if available]"                                  │
│    └─ SMS.sendSMSAsync(["+1234567890", ...], message)            │
│       └─ ✅ SMS SENT TO ALL CONTACTS                              │
└────────────────────────┬────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 3: Navigate to Map                                            │
│ └─ router.push("/map", { alertContext: JSON.stringify(alert) })   │
│    └─ map.jsx opens with alert data                               │
│    └─ Shows:                                                      │
│       - Red banner at top with alert details                      │
│       - Map with user location                                    │
│       - Hospital markers                                          │
│       - ETA to nearest hospital                                   │
│       - "Call Emergency" button                                   │
│       - "Get Directions" buttons per hospital                     │
└────────────────────────┬────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 4: POST to Backend                                            │
│ └─ syncToBackend(vitals, userId, "critical")                      │
│    └─ POST /vitals                                                │
│       {                                                           │
│         userId: "984xeP9zK4NpAkoy0psmVA5U9lD3",                  │
│         timestamp: "2026-06-23T15:45:00Z",                       │
│         vitals: { heartRate: 155, spo2: 88 },                   │
│         severity: "critical",                                    │
│         deviceType: "phone_sensors"                              │
│       }                                                          │
└────────────────────────┬────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Backend Processing (routes/vitals.js)                               │
│ 1. Save to MongoDB                                                 │
│ 2. Server-side checkThresholds(): CRITICAL ✅                     │
│ 3. broadcastToUser(userId, {                                      │
│      type: "VITAL_ALERT",                                         │
│      payload: { vital, severity, timestamp }                      │
│    })                                                              │
└────────────────────────┬────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────────┐
│ WebSocket Message to App                                           │
│ {                                                                   │
│   type: "VITAL_ALERT",                                            │
│   payload: {                                                      │
│     vital: "Heart Rate: 155 bpm",                                │
│     severity: "critical",                                        │
│     timestamp: "2026-06-23T15:45:00Z"                            │
│   }                                                               │
│ }                                                                  │
│                                                                    │
│ Double safety net: Confirms alert on frontend ✅                  │
└────────────────────────────────────────────────────────────────────┘

RESULT:
✅ Red SOS banner visible immediately
✅ SMS sent to 3 emergency contacts within 2 seconds
✅ Map opened with hospitals
✅ Backend logged event
✅ WebSocket confirmed alert
✅ User can now call 911 or get hospital directions
```

---

## 📁 Project Structure

### Frontend (React Native + Expo)

```
app/
├── _layout.jsx                    # Root layout with AlertBanner
└── (app)/
    ├── _layout.jsx                # App layout with screen stack
    ├── home.jsx                   # Dashboard with controls
    ├── map.jsx                    # Hospital finder + directions
    ├── emergency-contacts.jsx     # Manage emergency contacts
    ├── health-diagnostic.jsx      # Debug & test vitals
    ├── alerts.jsx                 # Alert history
    └── settings.jsx               # User preferences

src/
├── components/
│   └── AlertBanner.jsx            # Red SOS banner component
│
├── services/
│   ├── apiService.js              # HTTP client for backend
│   ├── emergencyService.js        # SMS & emergency contact logic
│   ├── googleFit.js               # Mock vitals generator
│   └── deviceService.js           # Device management
│
├── store/
│   ├── vitalsStore.js             # Central state (Zustand)
│   ├── authStore.js               # User authentication
│   └── emergencyStore.js          # Emergency contacts state
│
└── engine/
    └── alertEngine.js             # Polling & vitals lifecycle
```

### Backend (Node.js + Express + MongoDB)

```
backend/
├── server.js                      # Express server setup
│
├── routes/
│   ├── vitals.js                  # POST/GET vitals endpoints
│   ├── emergencyRoutes.js         # Emergency contact CRUD
│   ├── devices.js                 # Device management
│   └── alerts.js                  # Alert history
│
├── models/
│   ├── Vital.js                   # Vitals schema (TTL: 90 days)
│   ├── User.js                    # User schema
│   ├── Device.js                  # IoT jacket metadata
│   └── EmergencyContact.js        # Contact schema
│
├── websocket.js                   # WebSocket server setup
│
└── middleware/
    └── auth.js                    # JWT authentication
```

---

## 🔧 Tech Stack

### Frontend
- **React Native** - Cross-platform mobile framework
- **Expo** - React Native development & distribution
- **Zustand** - Lightweight state management
- **Expo Router** - File-based routing
- **Mapbox** - Maps & location services
- **Expo SMS** - Native SMS capabilities
- **React Native Gesture Handler** - Touch gestures

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **WebSocket (ws)** - Real-time communication
- **JWT** - Authentication

### External APIs
- **Foursquare Places API** - Hospital search
- **OSRM** - Route optimization
- **Mapbox GL** - Map rendering
- **Google Fit** - (Future) Smartwatch data integration
- **Twilio** - (Future) Voice calls

---

## 🚀 Installation

### Prerequisites

- Node.js 18+ and npm
- Android SDK or iOS SDK
- Expo CLI: `npm install -g expo-cli`
- MongoDB instance running locally or Atlas cloud

### Clone Repository

```bash
git clone https://github.com/yourusername/vitalsync.git
cd vitalsync
```

### Frontend Setup

```bash
# Install dependencies
npm install

# Install required Expo packages
npm install expo-sms expo-router expo-location @rnmapbox/maps zustand

# Install Babel preset
npm install --save-dev babel-preset-expo
```

### Backend Setup

```bash
cd backend

# Install dependencies
npm install express mongoose cors dotenv jsonwebtoken ws

# Create .env file
cat > .env << EOF
MONGO_URI=mongodb://localhost:27017/vitalsync
PORT=5000
JWT_SECRET=your-secret-key-here
EOF
```

---

## ▶️ Running the App

### Start Frontend (Mobile)

```bash
# Terminal 1: Start Metro bundler
npm start

# Terminal 2: Run on Android device/emulator
npx expo run:android --device

# OR run on iOS (Mac only)
npx expo run:ios --device
```

### Start Backend

```bash
cd backend

# Development mode with auto-reload
npm install -g nodemon
nodemon server.js

# Production mode
npm start
```

### Access the App

1. **Mobile App**: Opens on connected device/emulator
2. **Backend API**: http://localhost:5000
3. **WebSocket**: ws://localhost:5000/ws

---

## 📡 API Endpoints

### Vitals Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/vitals` | Submit vital reading |
| GET | `/vitals/:userId` | Get user's vital history |
| GET | `/vitals/:userId/latest` | Get most recent reading |

**POST /vitals** Request:
```json
{
  "userId": "984xeP9zK4NpAkoy0psmVA5U9lD3",
  "timestamp": "2026-06-23T15:45:00Z",
  "vitals": {
    "heartRate": { "value": 155, "unit": "bpm" },
    "spo2": { "value": 88, "unit": "%" }
  },
  "severity": "critical",
  "deviceType": "phone_sensors"
}
```

**Response:**
```json
{
  "ok": true,
  "id": "65f8d9e3c1a2b3d4e5f6g7h8",
  "alerts": [
    {
      "vitalKey": "heartRate",
      "vital": "Heart Rate: 155 bpm",
      "severity": "critical"
    }
  ]
}
```

### Emergency Contacts Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/emergency-contacts/:userId` | Get all contacts |
| POST | `/emergency-contacts/:userId` | Add new contact |
| DELETE | `/emergency-contacts/:userId/:contactId` | Remove contact |

**POST /emergency-contacts/:userId** Request:
```json
{
  "name": "Mom",
  "phone": "+1234567890",
  "relation": "Mother"
}
```

### WebSocket Events

| Event | Direction | Payload |
|-------|-----------|---------|
| CONNECTED | Server→Client | `{ type: "CONNECTED", userId: "..." }` |
| VITAL_ALERT | Server→Client | `{ type: "VITAL_ALERT", payload: {...} }` |
| VITALS_UPDATE | Server→Client | `{ type: "VITALS_UPDATE", payload: {...} }` |

---

## 🧩 Components & Services

### AlertBanner.jsx
```javascript
// Shows red SOS banner when vitals are abnormal
// Props: None (reads from vitalsStore)
// Actions: Tap to navigate to map, X to dismiss
```

### emergencyService.js
```javascript
// Handles SMS & emergency contact management
getEmergencyContacts(userId)      // Fetch contacts from backend
saveEmergencyContact(userId, {...}) // Add new contact
deleteEmergencyContact(userId, id)  // Remove contact
sendSOSAlert(userId, location, alert) // Send SMS to all contacts
```

### vitalsStore.js
```javascript
// Central state management
updateVitals(vitals)        // Process new readings
checkThresholds()           // Determine alert severity
syncToBackend()             // POST to /vitals
connectWebSocket()          // Listen for server alerts
disconnectWebSocket()       // Cleanup on logout
```

### alertEngine.js
```javascript
// Polling lifecycle
startAlertEngine(userId)    // Initialize polling & WS
stopAlertEngine()           // Stop polling & WS
poll()                      // Called every 15 seconds (generates mock vitals)
```

---

## ⚙️ Configuration

### Vital Sign Thresholds

Edit `src/store/vitalsStore.js`:

```javascript
export const THRESHOLDS = {
  heartRate: {
    min: 45,        // Minimum safe HR (bpm)
    max: 130,       // Maximum safe HR (bpm)
    label: "Heart Rate",
    unit: "bpm"
  },
  spo2: {
    min: 92,        // Minimum safe O2 saturation (%)
    max: 100,       // Maximum safe O2 saturation (%)
    label: "SpO2",
    unit: "%"
  },
  respiratoryRate: {
    min: 10,        // Minimum safe breathing rate
    max: 25,        // Maximum safe breathing rate
    label: "Respiratory Rate",
    unit: "breaths/min"
  },
  bodyTemp: {
    min: 35.5,      // Minimum safe temperature (°C)
    max: 38.5,      // Maximum safe temperature (°C)
    label: "Body Temperature",
    unit: "°C"
  }
};
```

**Customization:**
- Lower thresholds for athletes (higher max HR)
- Adjust for elderly patients (lower min HR)
- Account for high altitude (lower min SpO2)

### Severity Levels

- **Normal**: All vitals within range
- **Warning**: 5-15% outside threshold (yellow alert)
- **Critical**: >15% outside threshold (red alert) → triggers SMS + map

### Backend Configuration

Edit `backend/.env`:

```env
MONGO_URI=mongodb://localhost:27017/vitalsync
PORT=5000
JWT_SECRET=your-very-secret-key-change-this
FRONTEND_URL=http://localhost:3000
POLLING_INTERVAL=15000
```

### Frontend Configuration

Edit `src/store/vitalsStore.js` line 12:

```javascript
// Replace with your server's LAN IP for Android physical devices
const BACKEND_URL = "http://192.168.1.45:5000";
```

---

## 🧪 Testing

### Test 1: Normal Vitals
```
Expected: No alerts, data synced silently every 15s
Steps:
1. Open app
2. Check Metro logs for "[VitalsStore] ✅ Vitals normal"
3. Refresh database to confirm vitals saved
```

### Test 2: Critical Alert (Inject)
```
Expected: Red banner, map opens, SMS sent
Steps:
1. Open health-diagnostic screen
2. Tap "Inject CRITICAL vitals"
3. Verify:
   - Red SOS banner appears immediately ✅
   - Map opens automatically ✅
   - Hospital list loads ✅
   - Backend /vitals POST succeeds ✅
```

### Test 3: Emergency Contacts
```
Expected: SMS received on test contact
Steps:
1. Tap 🆘 Emergency Contacts button
2. Add your phone number
3. Tap "Send Test SOS"
4. Receive SMS with alert message ✅
```

### Test 4: Hospital Locator
```
Expected: Nearby hospitals displayed with ETA
Steps:
1. Trigger critical alert or tap banner
2. Map opens
3. Hospital cards appear below map
4. Tap hospital → get turn-by-turn directions ✅
```

### Test 5: WebSocket Real-time
```
Expected: Backend alert reaches app instantly
Steps:
1. Monitor Metro logs for "[WS] Message received"
2. Trigger critical alert from backend
3. App receives VITAL_ALERT via WS
4. Map opens automatically ✅
```

---

## 🗺️ Future Roadmap

### Phase 2: Smartwatch Integration
- [ ] Google Fit API integration
- [ ] Health Connect API integration
- [ ] Wear OS app for companion smartwatch
- [ ] Real heart rate data from wearable

### Phase 3: Enhanced Features
- [ ] Machine learning anomaly detection
- [ ] Predictive alerts before critical state
- [ ] Medication reminders
- [ ] Doctor integration (share vital history)
- [ ] Video call to emergency services

### Phase 4: Backend Scaling
- [ ] MongoDB Atlas cloud deployment
- [ ] Redis caching for performance
- [ ] Kafka event streaming
- [ ] Microservices architecture
- [ ] Docker containerization

### Phase 5: Advanced Emergency
- [ ] Twilio voice calls to emergency contacts
- [ ] Push notifications (iOS & Android)
- [ ] Bluetooth connection to home alert system
- [ ] Location sharing with emergency services
- [ ] QR code medical ID

### Phase 6: Analytics & Insights
- [ ] Health trend analysis
- [ ] Monthly vital summaries
- [ ] Comparative health reports
- [ ] Integration with health insurance

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m 'Add my feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

---

## 📞 Support

For issues, feature requests, or questions:

1. **GitHub Issues**: https://github.com/yourusername/vitalsync/issues
2. **Email**: support@vitalsync.app
3. **Documentation**: https://vitalsync-docs.com

---

## 🙏 Acknowledgments

- **Mapbox** for beautiful maps
- **Foursquare** for hospital data
- **OSRM** for routing
- **React Native** community
- All healthcare professionals who informed design

---

## ⚠️ Medical Disclaimer

**VitalSync is not a medical device.** This application is designed for informational purposes only and should not be used as a substitute for professional medical advice, diagnosis, or treatment. Always consult with a qualified healthcare provider.

**Emergency:** If experiencing a life-threatening emergency, call local emergency services (911 in US, 112 in EU, 999 in UK) immediately.

---

**Made with ❤️ for better health monitoring**

```
  ❤️  📊  🗺️  🚨
  
VitalSync - Real-time health. Real-time help.
```

---

*Last updated: June 2026 | Version 1.0.0*
