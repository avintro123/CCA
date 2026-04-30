  <div align="center">

# 🏏 CCA

**A full-stack real-time cricket scoring platform for local tournaments**

[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

---

*Manage tournaments, register teams, and deliver ball-by-ball live scores — all in real time.*

</div>

---

## 📖 Table of Contents

- [About](#-about)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the App](#running-the-app)
- [API Overview](#-api-overview)
- [WebSocket Events](#-websocket-events)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🏟️ About

**CricketApp** is a full-stack web application purpose-built for managing local town cricket tournaments. It provides a seamless experience for three types of users:

| Role | Capabilities |
|------|-------------|
| **Admin / Scorer** | Schedule matches, manage toss, record ball-by-ball scores in real time |
| **Team Captain** | Register teams, add player rosters with roles |
| **Fan / Viewer** | Watch live scores, ball-by-ball timeline, and tournament standings |

The app uses **WebSockets** for instant score broadcasting — every boundary, wicket, and extra is pushed to all connected viewers the moment it happens.

---

## ✨ Features

- ⚡ **Real-Time Live Scoring** — Ball-by-ball updates via WebSockets (Socket.IO) with instant broadcast to all viewers
- 🎯 **Admin Scoring Panel** — Record runs (0–6), extras (Wide, No Ball, Bye, Leg Bye), and wickets (Bowled, Caught, LBW, Run Out, Stumped, Hit Wicket)
- 📋 **Team Registration** — Captains register teams with full player rosters including roles (Batsman, Bowler, All-Rounder, Wicket Keeper)
- 📊 **Tournament Standings** — Dynamically calculated points table based on match results
- 🔐 **Google OAuth 2.0** — Secure authentication with role-based access control (Admin, Scorer, User)
- 📱 **Live Match View** — Real-time scorecard, ball-by-ball timeline, and match summary for fans
- 🏆 **Multi-Innings Support** — Full T20-style match flow with configurable overs and automated innings transitions
- 🔄 **Strike Rotation** — Automatic strike management on odd runs and over completions

---

## 🛠️ Tech Stack

### Frontend

| Technology | Purpose |
|-----------|---------|
| [React 19](https://react.dev/) | UI library |
| [TypeScript](https://www.typescriptlang.org/) | Type safety |
| [Vite](https://vitejs.dev/) | Build tool & dev server |
| [Tailwind CSS v4](https://tailwindcss.com/) | Utility-first styling |
| [Zustand](https://zustand-demo.pmnd.rs/) | Lightweight state management |
| [Socket.IO Client](https://socket.io/) | Real-time communication |
| [GSAP](https://gsap.com/) | Animations |
| [Lucide React](https://lucide.dev/) | Icon library |

### Backend

| Technology | Purpose |
|-----------|---------|
| [NestJS 11](https://nestjs.com/) | Server framework |
| [TypeScript](https://www.typescriptlang.org/) | Type safety |
| [Mongoose](https://mongoosejs.com/) | MongoDB ODM |
| [Passport.js](http://www.passportjs.org/) | Authentication middleware |
| [Socket.IO](https://socket.io/) | WebSocket gateway |
| [class-validator](https://github.com/typestack/class-validator) | DTO validation |

---

## 📂 Project Structure

```
CricketApp/
│
├── backend/                    # NestJS REST API + WebSocket Server
│   └── src/
│       ├── auth/               # Authentication module
│       │   ├── strategies/     # Google OAuth & JWT strategies
│       │   ├── guards/         # JWT guard, WebSocket guard, Roles guard
│       │   ├── decorators/     # Custom decorators (@Roles)
│       │   └── user.schema.ts  # User model (Google profile, role)
│       │
│       ├── match/              # Match & live scoring module
│       │   ├── dto/            # CreateMatch, RecordBall DTOs
│       │   ├── schemas/        # Match schema (innings, ball log, scorecard)
│       │   ├── match.gateway.ts    # WebSocket gateway (joinMatch, recordBall)
│       │   ├── match.service.ts    # Scoring logic & ball processing
│       │   └── match.controller.ts # REST endpoints
│       │
│       ├── tournament/         # Tournament & team management
│       │   ├── dto/            # CreateTeam DTO
│       │   ├── schemas/        # Team schema (players, roles, status)
│       │   ├── tournament.service.ts   # Team CRUD, standings calculation
│       │   └── tournament.controller.ts # REST endpoints
│       │
│       └── database/           # MongoDB connection configuration
│
├── frontend/                   # React + Vite SPA
│   └── src/
│       ├── pages/
│       │   ├── Home.tsx            # Landing page
│       │   ├── LiveMatch.tsx       # Live scorecard & ball timeline
│       │   ├── RegisterTeam.tsx    # Team registration form
│       │   ├── Standings.tsx       # Points table
│       │   └── admin/
│       │       └── ScoringInterface.tsx  # Ball-by-ball scoring panel
│       │
│       ├── components/         # Reusable UI components
│       │   ├── GlassCard.tsx       # Glassmorphism card
│       │   ├── NeonButton.tsx      # Animated CTA button
│       │   ├── Curtain.tsx         # Page transition animation
│       │   └── layout/
│       │       └── Navbar.tsx      # Navigation bar
│       │
│       ├── store/              # Zustand state management
│       │   └── useAuthStore.ts     # Auth state (token, user, role)
│       │
│       └── services/           # API client
│           └── api.ts              # Axios instance configuration
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- **Node.js** >= 18.x
- **npm** >= 9.x
- **MongoDB** (local instance or [MongoDB Atlas](https://www.mongodb.com/atlas))
- **Google Cloud Console** project with OAuth 2.0 credentials

### Installation

```bash
# Clone the repository
git clone https://github.com/avintro123/CCA.git
cd CCA

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/cricketapp

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# JWT
JWT_SECRET=your_jwt_secret_key
```

### Running the App

```bash
# Terminal 1 — Start the backend (port 3000)
cd backend
npm run start:dev

# Terminal 2 — Start the frontend (port 5173)
cd frontend
npm run dev
```

The app will be available at:
- **Frontend:** `http://localhost:5173`
- **Backend API:** `http://localhost:3000`

---

## 📡 API Overview

### Authentication

| Method | Endpoint | Description |
|--------|---------|-------------|
| `GET` | `/auth/google` | Initiate Google OAuth login |
| `GET` | `/auth/google/callback` | OAuth callback handler |

### Matches

| Method | Endpoint | Description |
|--------|---------|-------------|
| `POST` | `/match` | Create a new match |
| `GET` | `/match` | Get all matches |
| `GET` | `/match/:id` | Get match by ID |
| `PATCH` | `/match/:id/toss` | Record toss result |
| `PATCH` | `/match/:id/start` | Start a match |

### Teams & Tournament

| Method | Endpoint | Description |
|--------|---------|-------------|
| `POST` | `/tournament/team` | Register a new team |
| `GET` | `/tournament/teams` | Get all teams |
| `GET` | `/tournament/standings` | Get tournament standings |

---

## 🔌 WebSocket Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `joinMatch` | `{ matchId }` | Join a match room to receive live updates |
| `recordBall` | `RecordBallDto` | Record a ball delivery (admin/scorer only) |
| `updateScore` | `{ matchId, newScore }` | Manual score update (admin/scorer only) |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `ballUpdate` | Ball result + updated match | Emitted after each ball is recorded |
| `scoreUpdated` | Live scorecard object | Emitted with current score state |
| `error` | Error message string | Emitted on validation or permission errors |

---

## 📸 Screenshots

> *Coming soon — screenshots of the live scoring interface, match view, and standings page.*

---

## 🤝 Contributing

Contributions are welcome! Here's how:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

---

## 📄 License

This project is for personal/educational use. All rights reserved.

---

<div align="center">

**Built with ❤️ for local cricket tournaments**

</div>
