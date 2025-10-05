# Nexus - Student & Alumni Networking Platform

Nexus is a comprehensive social networking platform designed specifically for students and alumni of KIIT University. It provides a secure, feature-rich environment for networking, messaging, and professional development. The platform includes user authentication, profile management, connection handling, and real-time messaging capabilities.

## Features

- **Secure Authentication:** JWT-based authentication with domain-specific email validation (@kiit.ac.in)
- **User Management:** Complete user profiles with skills, interests, and location
- **Connection System:** Send, accept, reject, and manage connection requests
- **Messaging:** Real-time messaging between connected users
- **Role-based Access:** Support for Students, Alumni, and Administrators
- **Modern UI:** Beautiful, responsive interface built with Material-UI and Framer Motion
- **Type Safety:** Full TypeScript implementation for both frontend and backend

## Tech Stack

### Backend

- **[NestJS](https://nestjs.com/):** Progressive Node.js framework
- **[TypeScript](https://www.typescriptlang.org/):** Type-safe JavaScript
- **[Prisma](https://www.prisma.io/):** Next-generation ORM
- **[PostgreSQL](https://www.postgresql.org/):** Robust database
- **[JWT](https://jwt.io/):** Secure authentication
- **[Bcrypt](https://www.npmjs.com/package/bcrypt):** Password hashing

### Frontend

- **[React](https://reactjs.org/):** User interface library
- **[TypeScript](https://www.typescriptlang.org/):** Type safety
- **[Material-UI](https://mui.com/):** Component library
- **[Framer Motion](https://www.framer.com/motion/):** Animations
- **[React Router](https://reactrouter.com/):** Client-side routing
- **[Axios](https://axios-http.com/):** HTTP client

## Quick Start

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **PostgreSQL** database
- **Git**

### Installation

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd Nexus
   ```

2. **Install backend dependencies:**

   ```bash
   cd backend
   npm install
   cd ..
   ```

3. **Install frontend dependencies:**

   ```bash
   cd frontend
   npm install
   cd ..
   ```

### Environment Setup

1.  **Create environment file for the backend:**

    ```bash
    cd backend
    cp .env.example .env
    ```

2.  **Configure backend environment variables in `backend/.env`:**

    ```env
    # Database Configuration
    DATABASE_URL="postgresql://username:password@localhost:5432/nexus_db"

    # JWT Configuration
    JWT_SECRET="your-super-secret-and-long-string-here"

    # Application Configuration
    PORT=3000
    NODE_ENV=development
    ```

### Database Setup

1.  **Create PostgreSQL database:**

    ```sql
    CREATE DATABASE nexus_db;
    ```

2.  **Run Prisma migrations:**

    ```bash
    cd backend
    npx prisma migrate dev --name init
    ```

3.  **Generate Prisma client:**

    ```bash
    npx prisma generate
    ```

### Running the Application

1.  **Start the backend server:**

    ```bash
    cd backend
    # Development mode
    npm run start:dev

    # Production mode
    npm run build
    npm run start:prod
    ```

2.  **Start the frontend application:**

    ```bash
    cd frontend
    npm start
    ```

The application will be available at:

- **Frontend:** http://localhost:3001
- **Backend API:** http://localhost:3000

## Development Workflow

This project uses a professional development workflow to ensure code quality and consistency. The following tools are used:

- **Prettier**: For consistent code formatting.
- **ESLint**: for identifying and fixing code quality issues.
- **Husky**: For running pre-commit and pre-push hooks.
- **lint-staged**: For running checks on staged files before they are committed.
- **Commitlint**: For enforcing conventional commit messages.

### Committing Changes

When you commit changes, the following will happen:

1.  **Pre-commit hook**: `lint-staged` will run Prettier to format your staged files.
2.  **Commit message hook**: `commitlint` will check your commit message to ensure it follows the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification.

This ensures that all code is formatted correctly and that commit messages are consistent and readable.


## Project Structure

```
Nexus/
├── backend/                  # NestJS backend
│   ├── src/                  # Backend source code
│   │   ├── auth/             # Authentication module (JWT, guards, DTOs)
│   │   ├── user/             # User management
│   │   ├── connection/       # Connection handling
│   │   ├── messaging/        # Messaging system (real-time, gateway)
│   │   ├── engagement/       # Engagement features
│   │   ├── events/           # Event management
│   │   ├── gamification/     # Gamification logic
│   │   ├── referral/         # Referral system
│   │   ├── showcase/         # Showcases/portfolios
│   │   ├── sub-community/    # Sub-community logic
│   │   ├── sub-community-request/ # Sub-community requests
│   │   ├── email/            # Email integration
│   │   ├── files/            # File uploads, Google Drive integration
│   │   ├── notification/     # Notifications
│   │   ├── prisma/           # Prisma service
│   │   ├── common/           # Shared decorators, guards, utils
│   │   └── app.module.ts     # Main app module
│   ├── prisma/               # Database schema (schema.prisma)
│   ├── data/                 # Seed scripts
│   ├── test/                 # Backend tests
│   └── uploads/              # Uploaded files
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── pages/            # Page components
│   │   ├── contexts/         # React contexts (auth, user, etc.)
│   │   ├── hooks/            # Custom hooks
│   │   ├── route/            # Routing logic
│   │   ├── services/         # API services (Axios)
│   │   ├── types/            # TypeScript types
│   │   ├── utils/            # Utility functions
│   │   └── App.tsx           # Main app component
│   ├── public/               # Static assets
│   └── index.html            # HTML entry point
├── .github/                  # GitHub workflows & Copilot instructions
└── README.md                 # This file
```

### Backend Conventions
- Modular NestJS structure: each domain in its own folder
- DTOs for request/response validation (`src/*/dto/`)
- Role-based guards and decorators in `src/common/`
- Service/controller separation
- Prisma ORM for database access
- JWT authentication, role-based access

### Frontend Conventions
- React functional components, hooks, and context
- Material-UI for design, Framer Motion for animation
- API calls via `services/`, types in `types/`
- Role-based UI logic (Student, Alumni, Admin)

### Integration
- API base URL: `http://localhost:3000` (backend), `http://localhost:3001` (frontend)
- JWT sent in `Authorization` header for protected endpoints
- File uploads handled via backend `/files` endpoints, stored in `uploads/`

### References
- See `.github/copilot-instructions.md` for code conventions and architecture
- Backend: `backend/README.md`
- Frontend: `frontend/README.md`
- DB schema: `backend/prisma/schema.prisma`


## Security Features

- **JWT Authentication:** Secure token-based authentication
- **Password Hashing:** Bcrypt for password security
- **Domain Validation:** Email domain restriction (@kiit.ac.in)
- **CORS Protection:** Cross-origin request handling
- **Input Validation:** DTO-based request validation
- **Role-based Access:** Granular permission control via guards

## Contributing

1.  Fork the repository
2.  Create a feature branch
3.  Make your changes
4.  Add tests if applicable
5.  Submit a pull request

## License

This project is licensed under the UNLICENSED license.

## Support

For support and questions, please open an issue in the repository.
# Re-login test
