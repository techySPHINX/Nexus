# Copilot Instructions for Nexus Codebase

## Overview
Nexus is a full-stack platform for student and alumni networking, built with a NestJS backend (TypeScript, Prisma, PostgreSQL) and a React/TypeScript frontend (Material-UI, Framer Motion). The codebase is split into `backend/` and `frontend/` with clear service boundaries and shared conventions.

## Architecture & Key Patterns
- **Backend**: Modular NestJS structure (`src/`), each domain (auth, user, messaging, etc.) in its own folder. Uses Prisma ORM (`prisma/schema.prisma`). JWT-based auth, role-based guards, DTO validation, and service/controller separation are standard.
- **Frontend**: React with functional components, hooks, and context. Uses Material-UI for design, Framer Motion for animation, and Axios for API calls. State is managed via React Context and hooks.
- **API**: RESTful endpoints, JWT-protected except for auth. All endpoints expect/return JSON. See `backend/src/*/` for controllers and DTOs.
- **Database**: Managed via Prisma. Migrations and schema in `backend/prisma/`.

## Developer Workflows
- **Backend**:
  - Start dev server: `npm run start:dev` (hot reload)
  - Run tests: `npm run test` (unit), `npm run test:e2e` (e2e)
  - Format/lint: `npm run format`, `npm run lint`
  - DB: `npx prisma migrate dev --name <name>`, `npx prisma studio`, `npx prisma migrate reset`
- **Frontend**:
  - Start dev server: `npm start`
  - Build: `npm run build`
  - Test: `npm test`
- **Commit Workflow**: Prettier, ESLint, Husky, lint-staged, and Commitlint enforce code style and commit message conventions. Use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).

## Project-Specific Conventions
- **Backend**:
  - Use DTOs for all request/response validation (`src/*/dto/`).
  - Use `@GetCurrentUser('sub')` for extracting user ID from JWT.
  - Role-based access via guards in `src/common/guards/`.
  - Service logic in `*.service.ts`, API in `*.controller.ts`.
- **Frontend**:
  - Use Material-UI `sx` prop for styling, follow design system in `App.tsx`.
  - Use Framer Motion for all animations.
  - API calls via `services/` directory, types in `types/`.
  - Role-based UI logic (Student, Alumni, Admin) is common.

## Integration Points
- **Frontend <-> Backend**: API base URL is `http://localhost:3000`. JWT must be sent in `Authorization` header for protected endpoints.
- **Email, Google Drive, etc.**: See `backend/src/email/` and `backend/src/files/` for integration logic.

## Examples
- **Backend controller**: See `src/mentorship/mentorship.controller.ts` for patterns (DTOs, guards, user extraction).
- **Frontend page**: See `src/pages/Referrals.tsx` for form handling, role-based UI, and API integration.

## References
- Backend: `backend/README.md`
- Frontend: `frontend/README.md`
- Commit style: `commitlint.config.js`
- DB schema: `backend/prisma/schema.prisma`

---
For new patterns or unclear conventions, check the relevant `README.md` or existing code in the respective module.
