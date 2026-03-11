<div align="center">

<br/>

<img src="assets/images/logo.png" alt="VitalSync" width="100"/>

<h1>VitalSync</h1>

<p><strong>Real-Time IoT Safety & Emergency Response Platform</strong></p>

<p>
  <a href="https://reactnative.dev/"><img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Native"/></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/></a>
  <a href="https://expo.dev/"><img src="https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo"/></a>
  <a href="https://firebase.google.com/"><img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase"/></a>
  <a href="https://www.php.net/"><img src="https://img.shields.io/badge/PHP_JWT-Auth-777BB4?style=for-the-badge&logo=php&logoColor=white" alt="PHP JWT"/></a>
  <a href="https://www.mysql.com/"><img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL"/></a>
</p>

<p>
  <img src="https://img.shields.io/github/stars/Amanag43/VitalSync?style=flat-square&color=yellow" alt="Stars"/>
  <img src="https://img.shields.io/badge/Platform-Android%20%7C%20iOS-green?style=flat-square" alt="Platform"/>
  <img src="https://img.shields.io/badge/Status-Active%20Development-blue?style=flat-square" alt="Status"/>
</p>

<br/>

> **A production IoT safety platform that bridges the gap between a safety incident and immediate emergency response — in seconds.**

<br/>

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Hardware Integration](#-hardware-integration)
- [App Screens](#-app-screens)
- [Roadmap](#-roadmap)
- [Author](#-author)

---

## 🧠 Overview

When a safety incident occurs — a fall, a cardiac event, or a lone worker in distress — the critical window between incident and response is often lost. **VitalSync closes that gap.**

VitalSync pairs a **custom IoT wearable device** with a cross-platform mobile app to:
1. Continuously monitor the user's vitals and location
2. Automatically trigger an emergency alert on anomaly detection
3. Share live GPS coordinates with emergency contacts and responders
4. Calculate and display the fastest route to the nearest hospital — all in real time

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔴 **Auto Emergency Dispatch** | Emergency state triggered automatically from wearable sensor data via Zustand global store |
| 📍 **Real-Time GPS Tracking** | Continuous background location monitoring using `expo-location` |
| 🏥 **Hospital Routing** | Optimal route calculation to nearest hospital using Mapbox Polyline + React Native Maps |
| 🔐 **JWT Authentication** | Custom email/password auth against PHP REST API — Bearer token stored via Zustand + AsyncStorage, survives app restarts |
| 📡 **IoT Device Sync** | Bi-directional communication with custom wearable hardware over REST |
| 🔔 **Haptic Feedback** | Emergency alerts reinforced with device haptics via `expo-haptics` |
| 💾 **Persistent Auth** | Session survives app restarts via Zustand `persist` middleware + AsyncStorage |
| 📊 **Vitals Dashboard** | Live sensor data streamed from the IoT wearable |
| 🌐 **Cross-Platform** | Runs on Android & iOS via Expo SDK 54 |

---

## 🛠 Tech Stack

### Mobile App
| Category | Technology |
|---|---|
| Framework | React Native 0.81 (Expo SDK 54) |
| Language | TypeScript + JavaScript |
| Navigation | Expo Router v6 (file-based) + React Navigation |
| State Management | Zustand v5 (persist middleware) |
| Maps & Routing | React Native Maps + `@mapbox/polyline` |
| Location | `expo-location` |
| Authentication | Custom PHP JWT (email/password) — `Bearer` token flow |
| Storage | AsyncStorage (persisted auth via Zustand) |
| UI | React Native Paper + React Native Elements |
| Animations | React Native Reanimated v4 |
| Gestures | React Native Gesture Handler |
| Bottom Sheet | `@gorhom/bottom-sheet` |
| Haptics | `expo-haptics` |

### Backend & Cloud
| Category | Technology |
|---|---|
| REST API | PHP (custom MVC API) |
| Database | MySQL |
| Auth | JWT — custom token issuance & validation |
| Real-Time Sync | Firebase Firestore |

---

## 🏗 Architecture

```
VitalSync/
│
├── app/                          # Expo Router — file-based screens
│   ├── (auth)/                   # Auth flow
│   │   ├── login.jsx             # Google OAuth sign-in
│   │   ├── signup.jsx            # New user registration
│   │   └── _layout.jsx           # Auth stack layout
│   ├── (app)/                    # Protected app screens
│   │   ├── home.jsx              # Dashboard & vitals overview
│   │   ├── alert.jsx             # Active emergency alert view
│   │   ├── add-device.jsx        # Pair new IoT wearable
│   │   ├── device-details.jsx    # Device status & sensor data
│   │   └── edit-device.jsx       # Manage paired device
│   ├── alerts.jsx                # Alert history log
│   ├── contacts.jsx              # Emergency contacts management
│   ├── map.jsx                   # GPS tracking & hospital routing
│   ├── settings.jsx              # User preferences & app config
│   ├── loading.jsx               # Auth hydration / splash
│   └── _layout.tsx               # Root layout & navigation guards
│
├── src/
│   ├── components/               # Shared UI components
│   ├── config/                   # API base URLs, Firebase init, constants
│   ├── providers/                # Context providers (theme, auth)
│   ├── store/
│   │   ├── authStore.js          # Auth state (token, user, hydration)
│   │   └── emergencyStore.js     # Emergency state machine
│   ├── theme/                    # Design tokens (colors, typography, spacing)
│   └── utils/                    # Helper functions, formatters
│
├── components/                   # Root-level reusable components
├── constants/                    # App-wide enums & config values
├── hooks/
│   └── useGoogleAuth.js          # Google OAuth hook
├── assets/
│   └── images/                   # App icons, splash, logos
│
├── .env.example                  # Environment variable template
├── App.js                        # Expo Router entry point
├── app.json                      # Expo configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json
```

### Auth Flow
```
User enters email + password
       ↓
POST /api/v1/auth/login.php  →  PHP validates credentials
       ↓
Returns Bearer JWT token
       ↓
GET /api/v1/auth/me.php (Authorization: Bearer <token>)
       ↓
User object returned → saved to Zustand + AsyncStorage
       ↓
Persists across app restarts via Zustand persist middleware
```

VitalSync uses **Zustand** for lightweight global state with two core stores:

```
┌──────────────────────────┐     ┌──────────────────────────┐
│      useAuthStore         │     │    useEmergencyStore      │
│──────────────────────────│     │──────────────────────────│
│ token                    │     │ emergencyActive: boolean  │
│ user                     │     │ emergencyReason: string   │
│ isLoggedIn               │     │──────────────────────────│
│ hydrated                 │     │ startEmergency(reason)    │
│──────────────────────────│     │ stopEmergency()           │
│ setAuth(token, user)     │     │ isEmergency()             │
│ clearAuth()              │     └──────────────────────────┘
│ setHydrated()            │
│──────────────────────────│
│ Persisted via            │
│ AsyncStorage             │
└──────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18
- Expo CLI — `npm install -g expo-cli`
- Android Studio (Android) or Xcode (iOS)
- Firebase project with **Auth** and **Firestore** enabled
- PHP server with MySQL (for backend REST API)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Amanag43/VitalSync.git
cd VitalSync

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env with your Firebase credentials and API URL

# 4. Start development server
npx expo start

# Run on specific platform
npx expo run:android
npx expo run:ios
```

---

## 🔑 Environment Variables

Create a `.env` file in the root — **never commit this file.**

```env
# Firebase
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id

# Backend REST API
EXPO_PUBLIC_API_BASE_URL=https://your-php-server.com/api

# Google OAuth
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

> See `.env.example` for the full template.

---

## 📡 Hardware Integration

VitalSync is designed to pair with a **custom IoT wearable device**. The wearable communicates with the app via the PHP REST API and captures:

- 💓 **Heart Rate (BPM)** — continuous vitals monitoring
- 🏃 **Accelerometer** — fall and impact detection
- 📍 **GPS** — hardware-level location as a phone fallback

On anomaly detection, the device sends a trigger to the backend → Firebase Firestore updates → the app's `emergencyStore` activates in real time → emergency dispatch flow begins automatically.

> 🤝 Active hardware partnership outreach is ongoing. Interested in collaborating? See contact info below.

---

## 📱 App Screens

| Screen | Description |
|---|---|
| **Login / Signup** | Email/password auth against PHP JWT API — token fetched, user hydrated via `/auth/me.php`, persisted in AsyncStorage |
| **Home** | Live vitals dashboard, device connection status, quick SOS trigger |
| **Alert** | Active emergency view — real-time status, dispatch progress |
| **Alerts** | Full alert history log with timestamps and resolved status |
| **Add Device** | Pair a new IoT wearable via device ID or discovery |
| **Device Details** | Live sensor data readout — heart rate, accelerometer, GPS |
| **Edit Device** | Rename, reconfigure, or unpair a wearable device |
| **Map** | Real-time GPS tracking + nearest hospital routing via Mapbox polyline |
| **Contacts** | Manage emergency contacts notified on SOS dispatch |
| **Settings** | User preferences, notification config, account management |
| **Loading** | Auth session hydration / splash screen on app start |

---

## 🔮 Roadmap

- [ ] ML-based anomaly detection on vitals stream
- [ ] Multi-user group monitoring (family / team safety)
- [ ] Offline mode with local alert queuing
- [ ] Direct integration with hospital dispatch APIs
- [ ] Apple Watch / Wear OS companion app
- [ ] Web-based admin dashboard for fleet/team managers

---

## 🤝 Contributing

Contributions and feature requests are welcome! Please open an issue first to discuss proposed changes.

```bash
git checkout -b feature/your-feature
git commit -m "feat: describe your change"
git push origin feature/your-feature
# Then open a Pull Request
```

---

## 👤 Author

**Aman Agarwal** — B.Tech ECE @ MAIT, Delhi

[![GitHub](https://img.shields.io/badge/GitHub-Amanag43-181717?style=flat-square&logo=github)](https://github.com/Amanag43)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Aman_Agarwal-0A66C2?style=flat-square&logo=linkedin)](https://linkedin.com/in/aman-agarwal-396921245)

---

## 📄 License

This project is under active commercial development. All rights reserved © 2025 Aman Agarwal.

---

<div align="center">
  <sub>Built with ❤️ — connecting IoT hardware to human safety</sub>
</div>
