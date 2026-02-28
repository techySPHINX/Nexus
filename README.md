<div align="center">

<h1>
  <img src="https://img.shields.io/badge/NEXUS-KIIT-blue?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0wIDE4Yy00LjQxIDAtOC0zLjU5LTgtOHMzLjU5LTggOC04IDggMy41OSA4IDgtMy41OSA4LTggOHoiLz48L3N2Zz4=" alt="Nexus" />
</h1>

# Nexus — KIIT Student & Alumni Network

### _Empowering Every KIITian — Where Connections Shape Careers and Communities Thrive._

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-Nexus%20Proprietary-critical?style=flat-square" alt="License" /></a>
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=flat-square&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/Prisma-3982CE?style=flat-square&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-336791?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Socket.IO-010101?style=flat-square&logo=socket.io&logoColor=white" alt="Socket.IO" />
  <img src="https://img.shields.io/badge/Built%20for-KIIT%20University-orange?style=flat-square" alt="KIIT" />
</p>

<p align="center">
  <b>A full-stack, real-time social networking platform exclusively built for the KIIT University community —<br/>connecting students and alumni through mentorship, referrals, messaging, and professional growth.</b>
</p>

> **For contributions, partnerships, or permissions:** Contact [jaganhotta357@outlook.com](mailto:jaganhotta357@outlook.com) before raising any PR or issue.

</div>

---

## Table of Contents

- [About Nexus](#about-nexus)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Security](#security)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## About Nexus

**Nexus** is a purpose-built social networking platform exclusively for the **KIIT University** ecosystem. It bridges the gap between current students and alumni by providing a rich suite of tools — from real-time messaging and mentorship programs to job referrals and community sub-groups — all within a secure, verified, domain-restricted environment (`@kiit.ac.in`).

This platform was designed, architected, and built entirely by the KIIT community. It is not an open-source project. All rights are reserved by the original authors. See the [LICENSE](LICENSE) for full legal terms.

---

## Features

<details open>
<summary><b>🔐 Authentication & Identity</b></summary>

| Feature                        | Details                                      |
| ------------------------------ | -------------------------------------------- |
| Domain-restricted Registration | Only `@kiit.ac.in` emails are accepted       |
| Document Verification          | Admin-reviewed document submission on signup |
| JWT Authentication             | Secure access/refresh token pair             |
| Role-based Access Control      | Student · Alumni · Administrator roles       |
| Password Security              | bcrypt hashing with salt rounds              |
| Profile Management             | Skills, interests, location, bio, avatar     |
| Google Drive Integration       | File uploads via Google Drive API            |

</details>

<details open>
<summary><b>🤝 Networking & Connections</b></summary>

| Feature             | Details                                          |
| ------------------- | ------------------------------------------------ |
| Connection Requests | Send · Accept · Reject · Remove                  |
| Smart Suggestions   | Based on mutual connections and shared interests |
| User Discovery      | Advanced search and filtering                    |
| Alumni Directory    | Browse all verified KIIT alumni                  |

</details>

<details open>
<summary><b>💬 Real-time Messaging</b></summary>

| Feature               | Details                         |
| --------------------- | ------------------------------- |
| WebSocket Chat        | Powered by Socket.IO            |
| Typing Indicators     | Live typing status              |
| Read Receipts         | Message seen tracking           |
| Unread Counts         | Per-conversation badge counters |
| Message History       | Paginated conversation history  |
| Browser Notifications | Push alerts for new messages    |

</details>

<details open>
<summary><b>📝 Content & Communities</b></summary>

| Feature              | Details                            |
| -------------------- | ---------------------------------- |
| Post System          | Create · Like · Comment · Vote     |
| Sub-communities      | Interest-based groups within KIIT  |
| Events               | Create events with RSVP management |
| Showcase / Portfolio | Share projects and achievements    |
| File Sharing         | Attach and share files in posts    |

</details>

<details open>
<summary><b>🎓 Mentorship Program</b></summary>

| Feature                | Details                               |
| ---------------------- | ------------------------------------- |
| Mentor–Mentee Matching | Skills and interest based pairing     |
| Application Flow       | Request → Review → Accept / Reject    |
| Goal Tracking          | Set and monitor mentorship milestones |
| Meeting Scheduler      | Book and manage sessions              |
| Feedback System        | Rate and review mentorship quality    |

</details>

<details open>
<summary><b>💼 Referrals</b></summary>

| Feature               | Details                                |
| --------------------- | -------------------------------------- |
| Job Referral Board    | Alumni post referral opportunities     |
| Referral Applications | Students apply with resume and profile |
| Status Tracking       | Track application status in real time  |

</details>

<details open>
<summary><b>🏆 Gamification</b></summary>

| Feature          | Details                             |
| ---------------- | ----------------------------------- |
| Badge System     | Earn badges for platform milestones |
| Points & Rewards | Activity-based point accumulation   |
| Leaderboards     | Campus-wide engagement rankings     |

</details>

<details open>
<summary><b>🔔 Notifications</b></summary>

| Feature                  | Details                           |
| ------------------------ | --------------------------------- |
| Email Notifications      | Transactional emails via SendGrid |
| In-app Notifications     | Real-time notification feed       |
| Notification Preferences | Per-user notification settings    |

</details>

---

## Tech Stack

### Backend

| Layer      | Technology                                                                  |
| ---------- | --------------------------------------------------------------------------- |
| Framework  | [NestJS](https://nestjs.com/) — modular, TypeScript-first Node.js framework |
| ORM        | [Prisma](https://www.prisma.io/) — type-safe database access                |
| Database   | [PostgreSQL](https://www.postgresql.org/) — robust relational database      |
| Real-time  | [Socket.IO](https://socket.io/) — WebSocket-based bidirectional events      |
| Auth       | [JWT](https://jwt.io/) + [Passport.js](http://www.passportjs.org/)          |
| Email      | [SendGrid](https://sendgrid.com/) — transactional email delivery            |
| Storage    | [Google Drive API](https://developers.google.com/drive) — file uploads      |
| Validation | [class-validator](https://github.com/typestack/class-validator) + DTOs      |
| API Docs   | [Swagger / OpenAPI](https://swagger.io/)                                    |
| Security   | bcrypt · CORS · Helmet · Rate limiting                                      |

### Frontend

| Layer             | Technology                                                         |
| ----------------- | ------------------------------------------------------------------ |
| UI Framework      | [React 18](https://reactjs.org/) — hooks-based component model     |
| Language          | [TypeScript](https://www.typescriptlang.org/) — static type safety |
| Component Library | [Material-UI (MUI)](https://mui.com/) — design system              |
| Styling           | [Tailwind CSS](https://tailwindcss.com/) — utility-first CSS       |
| Animations        | [Framer Motion](https://www.framer.com/motion/)                    |
| Routing           | [React Router v6](https://reactrouter.com/)                        |
| HTTP Client       | [Axios](https://axios-http.com/)                                   |
| Real-time         | [Socket.IO Client](https://socket.io/docs/v4/client-api/)          |
| Build Tool        | [Vite](https://vitejs.dev/)                                        |
| State             | React Context API + custom hooks                                   |

### DevOps & Tooling

| Tool                    | Purpose                                         |
| ----------------------- | ----------------------------------------------- |
| Docker + Docker Compose | Containerised local and production environments |
| Nginx                   | Reverse proxy for production                    |
| ESLint + Prettier       | Code quality and formatting                     |
| Husky + lint-staged     | Git pre-commit hooks                            |
| Commitlint              | Conventional commit enforcement                 |
| Jest                    | Unit and e2e testing                            |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        NEXUS PLATFORM                           │
├───────────────────────┬─────────────────────────────────────────┤
│      React Frontend   │         NestJS Backend                  │
│   (Vite · MUI · TS)   │   (TypeScript · Prisma · PostgreSQL)   │
│                       │                                         │
│  ┌─────────────────┐  │  ┌──────────┐  ┌──────────────────┐   │
│  │  Pages/Components│  │  │REST API  │  │ WebSocket Gateway│   │
│  │  Auth · Chat    │◄─┼─►│ /auth    │  │ Socket.IO        │   │
│  │  Profile · Posts│  │  │ /users   │  │ Real-time Events │   │
│  │  Mentorship     │  │  │ /messages│  └──────────────────┘   │
│  │  Referrals      │  │  │ /posts   │                          │
│  └─────────────────┘  │  │ ...      │  ┌──────────────────┐   │
│                       │  └──────────┘  │   Prisma ORM     │   │
│  ┌─────────────────┐  │                │  PostgreSQL DB    │   │
│  │  React Contexts │  │  ┌──────────┐  └──────────────────┘   │
│  │  AuthContext    │  │  │ Guards   │                          │
│  │  NotifContext   │  │  │ JWT Auth │  ┌──────────────────┐   │
│  └─────────────────┘  │  │ RBAC     │  │  External APIs   │   │
│                       │  └──────────┘  │  SendGrid        │   │
└───────────────────────┴────────────────│  Google Drive    │───┘
                                         └──────────────────┘
```

---

## Quick Start

### Prerequisites

| Requirement | Minimum Version |
| ----------- | --------------- |
| Node.js     | v18+            |
| PostgreSQL  | v14+            |
| npm / pnpm  | latest          |
| Git         | any             |

### 1. Clone

```bash
git clone https://github.com/techySPHINX/Nexus.git
cd Nexus
```

### 2. Install Dependencies

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 3. Configure Environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/nexus_db"

# JWT
JWT_SECRET="your-super-secret-and-long-string-here"
JWT_EXPIRES_IN="7d"

# App
PORT=3000
NODE_ENV=development

# Email (SendGrid)
SENDGRID_API_KEY="SG.your-sendgrid-api-key"
SENDGRID_FROM_EMAIL="noreply@nexus.kiit.ac.in"

# Google Drive
GOOGLE_DRIVE_CLIENT_ID="your-google-client-id"
GOOGLE_DRIVE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_DRIVE_REDIRECT_URI="http://localhost:3000/auth/google/callback"
```

### 4. Database Setup

```bash
cd backend

# Create the database
createdb nexus_db

# Run migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# (Optional) Seed sample data
npm run seed
```

### 5. Start Development Servers

```bash
# Terminal 1 — Backend
cd backend && npm run start:dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

| Service      | URL                       |
| ------------ | ------------------------- |
| Frontend     | http://localhost:3002     |
| Backend API  | http://localhost:3000     |
| Swagger Docs | http://localhost:3000/api |

---

## Project Structure

```
Nexus/
├── backend/                        # NestJS API server
│   ├── src/
│   │   ├── auth/                   # JWT auth, guards, strategies, DTOs
│   │   ├── user/                   # User profiles and management
│   │   ├── connection/             # Connection system
│   │   ├── messaging/              # Real-time chat + WebSocket gateway
│   │   ├── post/                   # Posts, likes, comments
│   │   ├── sub-community/          # Community groups
│   │   ├── mentorship/             # Mentor-mentee system
│   │   ├── referral/               # Job referral board
│   │   ├── showcase/               # Portfolio and projects
│   │   ├── gamification/           # Badges and points
│   │   ├── notification/           # In-app + email notifications
│   │   ├── email/                  # SendGrid email service
│   │   ├── files/                  # File upload (Google Drive)
│   │   ├── events/                 # Event management
│   │   ├── engagement/             # Engagement analytics
│   │   ├── admin/                  # Admin · document verification
│   │   ├── prisma/                 # Prisma service wrapper
│   │   └── common/                 # Guards, decorators, utilities
│   ├── prisma/
│   │   └── schema.prisma           # Database schema (source of truth)
│   └── data/                       # Seed scripts
│
├── frontend/                       # React + Vite application
│   └── src/
│       ├── components/             # Shared reusable components
│       ├── pages/                  # Route-level page components
│       │   ├── Dashboard.tsx
│       │   ├── ChatPage.tsx
│       │   ├── Connections.tsx
│       │   ├── Profile.tsx
│       │   ├── Referrals.tsx
│       │   └── Admin/
│       ├── contexts/               # AuthContext · ThemeContext · NotifContext
│       ├── hooks/                  # Custom React hooks
│       ├── services/               # Axios API wrappers + WebSocket service
│       ├── types/                  # TypeScript interfaces and types
│       └── utils/                  # Helpers and utilities
│
├── docs/                           # Extended documentation
├── docker-compose.production.yml   # Production container orchestration
├── nginx.conf                      # Nginx reverse proxy config
└── README.md
```

---

## API Reference

Full interactive docs available at `http://localhost:3000/api` (Swagger/OpenAPI).

### Core Endpoints

#### Authentication

```
POST   /auth/register       Register with @kiit.ac.in email
POST   /auth/login          Login and receive JWT
POST   /auth/refresh        Refresh access token
```

#### Users

```
GET    /users               List all users (paginated)
GET    /users/:id           Get user profile
PUT    /users/:id           Update profile
GET    /users/search        Search by name, skills, role
```

#### Connections

```
GET    /connection                  My connections
POST   /connection/send             Send connection request
PATCH  /connection/status           Accept or reject
GET    /connection/suggestions      Smart suggestions
```

#### Messaging

```
GET    /messages/conversations/all          All conversations
GET    /messages/conversation/:userId       Messages with a user
POST   /messages                            Send a message
WS     /ws                                  Real-time socket events
```

#### Mentorship

```
GET    /mentorship          Browse mentors
POST   /mentorship/apply    Apply to a mentor
PATCH  /mentorship/:id      Update session / status
```

#### Referrals

```
GET    /referral            Browse referral opportunities
POST   /referral            Post a referral (Alumni only)
POST   /referral/:id/apply  Apply to a referral
```

---

## Security

| Measure           | Implementation                               |
| ----------------- | -------------------------------------------- |
| Authentication    | JWT access + refresh token pair              |
| Password Storage  | bcrypt with configurable salt rounds         |
| Email Restriction | Domain locked to `@kiit.ac.in`               |
| Input Validation  | `class-validator` on all DTOs                |
| SQL Injection     | Prevented by Prisma parameterized queries    |
| XSS               | Input sanitization at API boundary           |
| CORS              | Configurable origin whitelist                |
| Rate Limiting     | Per-IP throttle guard on auth endpoints      |
| RBAC              | Role guards protecting all privileged routes |

---

## Deployment

### Docker (Recommended)

```bash
docker-compose -f docker-compose.production.yml up -d
```

### Manual

```bash
# Backend
cd backend
npm run build
npm run start:prod

# Frontend
cd frontend
npm run build
# Serve dist/ via Nginx or any static host
```

### Production Environment Variables

Ensure the following are set in your hosting environment:

- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — Long random secret (min 64 chars)
- `SENDGRID_API_KEY` — Email service key
- `GOOGLE_DRIVE_*` — Google Drive OAuth credentials
- `NODE_ENV=production`
- `CORS_ORIGIN` — Your frontend domain

---

## Contributing

> ⚠️ **READ CAREFULLY BEFORE CONTRIBUTING**

This project is **not an open-source project**. All rights are reserved by the original authors. Contributions are accepted on a **strict invitation-only basis**.

### Before You Do Anything

**You must contact the maintainer first:**

📧 **[jaganhotta357@outlook.com](mailto:jaganhotta357@outlook.com)**

No pull requests, forks for redistribution, or derivative deployments will be accepted without prior written approval. Unauthorized contributions will be declined and all associated code will remain the intellectual property of the original authors under the [Nexus Proprietary License](LICENSE).

### If Approved, Follow These Steps

1. Contact [jaganhotta357@outlook.com](mailto:jaganhotta357@outlook.com) and describe your proposed contribution
2. Wait for written approval and contribution guidelines
3. Fork the repository **only after** receiving approval
4. Create a focused branch: `git checkout -b feat/your-approved-feature`
5. Write clean, typed, tested code following existing conventions
6. Commit using [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` new feature
   - `fix:` bug fix
   - `docs:` documentation change
   - `refactor:` code restructure
   - `test:` test additions
   - `chore:` tooling/config
7. Open a PR referencing your approval email thread

### Code Standards

- TypeScript strict mode — no `any` without justification
- DTOs for all API request/response shapes
- Tests required for service-layer logic
- Prettier + ESLint must pass (`npm run lint && npm run format`)
- Follow [Nexus Copilot Instructions](.github/copilot-instructions.md)

---

## Testing

```bash
# Backend unit tests
cd backend && npm run test

# Backend e2e tests
cd backend && npm run test:e2e

# Backend coverage
cd backend && npm run test:cov

# Frontend tests
cd frontend && npm test
```

---

## License

Copyright © 2024–2026 **techySPHINX** and the Nexus contributors. All rights reserved.

This project is licensed under the **Nexus Proprietary License** — see the [LICENSE](LICENSE) file for full terms.

**In summary:**

- You may **not** copy, fork, clone, redistribute, or deploy this software without explicit written permission.
- You may **not** create derivative works or platforms based on this codebase.
- All intellectual property, including code, architecture, design, and documentation, belongs to the original authors.
- Any unauthorized use is a violation and will be subject to legal action.

For licensing inquiries: [jaganhotta357@outlook.com](mailto:jaganhotta357@outlook.com)

---

## Support

| Channel              | Link                                                                   |
| -------------------- | ---------------------------------------------------------------------- |
| Bug Reports          | [Open a GitHub Issue](https://github.com/techySPHINX/Nexus/issues)     |
| Feature Requests     | [GitHub Discussions](https://github.com/techySPHINX/Nexus/discussions) |
| General Inquiry      | [jaganhotta357@outlook.com](mailto:jaganhotta357@outlook.com)          |
| Contribution Request | [jaganhotta357@outlook.com](mailto:jaganhotta357@outlook.com)          |

---

<div align="center">

**Built with ❤️ for the KIIT Community**

_Nexus — Empowering Every KIITian. Where Connections Shape Careers and Communities Thrive._

© 2024–2026 techySPHINX · KIIT University · All Rights Reserved

</div>
