# Nexus - Student & Alumni Networking Platform

[![License: UNLICENSED](https://img.shields.io/badge/License-UNLICENSED-red.svg)](https://opensource.org/licenses/Unlicense)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![SendGrid](https://img.shields.io/badge/SendGrid-00A6FF?logo=sendgrid&logoColor=white)](https://sendgrid.com/)

Nexus is a comprehensive social networking platform designed specifically for students and alumni of KIIT University. It provides a secure, feature-rich environment for networking, messaging, professional development, mentorship, and community building.

## 🚀 Features

### 🔐 Authentication & User Management
- **Registration** document-based registration (submit document URLs)
- **JWT-based Authentication** with domain-specific email validation (@kiit.ac.in)
- **Role-based Access Control** (Student, Alumni, Administrator)
- **Secure Password Hashing** using bcrypt
- **Profile Management** with skills, interests, location, and bio
- **File Upload System** with Google Drive integration

### 🤝 Connection & Networking
- **Connection System** - Send, accept, reject, and manage connection requests
- **User Search & Discovery** with advanced filtering
- **Connection Suggestions** based on mutual connections and interests
- **Professional Networking** tools for career development

### 💬 Real-time Communication
- **WebSocket-based Messaging** with Socket.IO
- **Real-time Chat** with typing indicators
- **Message Notifications** with browser notifications
- **Unread Message Tracking** with visual indicators
- **Message History** with pagination

### 📝 Content & Community
- **Post System** with likes, comments, and voting
- **Sub-communities** for specialized groups
- **Event Management** and RSVP system
- **Showcase/Portfolio** system for projects and achievements
- **File Sharing** and collaboration tools

### 🎓 Mentorship & Learning
- **Mentorship System** with mentor-mentee matching
- **Mentorship Applications** and request management
- **Goal Setting** and progress tracking
- **Meeting Scheduling** and management
- **Feedback System** for mentorship quality

### 🏆 Gamification & Engagement
- **Badge System** for achievements
- **Points and Rewards** for platform engagement
- **Leaderboards** and ranking system
- **Engagement Tracking** and analytics

### 📧 Notifications & Communication
- **Email Notifications** via SendGrid
- **In-app Notifications** system
- **Real-time Updates** for all platform activities
- **Notification Preferences** and settings

## 🛠️ Tech Stack

### Backend Technologies
- **[NestJS](https://nestjs.com/)** - Progressive Node.js framework with TypeScript
- **[Prisma](https://www.prisma.io/)** - Next-generation ORM with PostgreSQL
- **[PostgreSQL](https://www.postgresql.org/)** - Robust relational database
- **[Socket.IO](https://socket.io/)** - Real-time bidirectional communication
- **[JWT](https://jwt.io/)** - Secure token-based authentication
- **[Bcrypt](https://www.npmjs.com/package/bcrypt)** - Password hashing
- **[SendGrid](https://sendgrid.com/)** - Email service integration
 - **[SendGrid](https://sendgrid.com/)** - Email service integration
- **[Google APIs](https://developers.google.com/)** - Google Drive integration
- **[Multer](https://www.npmjs.com/package/multer)** - File upload handling
- **[Swagger](https://swagger.io/)** - API documentation

### Frontend Technologies
- **[React 18](https://reactjs.org/)** - Modern UI library with hooks
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Material-UI (MUI)](https://mui.com/)** - React component library
- **[Tailwind-CSS](https://tailwindcss.com/)** - CSS Framework
- **[Framer Motion](https://www.framer.com/motion/)** - Animation library
- **[React Router](https://reactrouter.com/)** - Client-side routing
- **[Axios](https://axios-http.com/)** - HTTP client for API calls
- **[Socket.IO Client](https://socket.io/docs/v4/client-api/)** - Real-time communication
- **[Vite](https://vitejs.dev/)** - Fast build tool and dev server
- **[Date-fns](https://date-fns.org/)** - Date utility library
- **[JWT Decode](https://www.npmjs.com/package/jwt-decode)** - JWT token handling

### Development Tools
- **[ESLint](https://eslint.org/)** - Code linting and quality
- **[Prettier](https://prettier.io/)** - Code formatting
- **[Jest](https://jestjs.io/)** - Testing framework
- **[Husky](https://typicode.github.io/husky/)** - Git hooks
- **[Commitlint](https://commitlint.js.org/)** - Commit message linting

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **PostgreSQL** (v12 or higher)
- **Git**

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/techySPHINX/Nexus.git
cd Nexus
```

### 2. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Environment Setup

Create environment files for both backend and frontend:

```bash
# Backend environment
cd backend
cp .env.example .env
```

Configure `backend/.env`:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/nexus_db"

# JWT Configuration
JWT_SECRET="your-super-secret-and-long-string-here"
JWT_EXPIRES_IN="7d"

# Application Configuration
PORT=3000
NODE_ENV=development

# Email Configuration (SendGrid)
SENDGRID_API_KEY="SG.your-sendgrid-api-key"
SENDGRID_FROM_EMAIL="noreply@nexus.kiit.ac.in"

# Google Drive Configuration
GOOGLE_DRIVE_CLIENT_ID="your-google-client-id"
GOOGLE_DRIVE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_DRIVE_REDIRECT_URI="http://localhost:3000/auth/google/callback"
```

### 4. Database Setup

```bash
# Create PostgreSQL database
createdb nexus_db

# Run Prisma migrations
cd backend
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Seed the database (optional)
npm run seed
```

### 5. Start the Application

```bash
# Start backend server (Terminal 1)
cd backend
npm run start:dev

# Start frontend application (Terminal 2)
cd frontend
npm run dev
```

The application will be available at:
- **Frontend:** http://localhost:3002
- **Backend API:** http://localhost:3000
- **API Documentation:** http://localhost:3000/api

## 📁 Project Structure

```
Nexus/
├── backend/                          # NestJS Backend
│   ├── src/
│   │   ├── auth/                     # Authentication module
│   │   │   ├── auth.controller.ts     # Auth endpoints
│   │   │   ├── auth.service.ts       # Auth business logic
│   │   │   ├── guards/               # JWT guards
│   │   │   ├── strategies/            # Passport strategies
│   │   │   └── dto/                  # Auth DTOs
│   │   ├── user/                     # User management
│   │   ├── connection/               # Connection system
│   │   ├── messaging/                # Real-time messaging
│   │   │   ├── messaging.controller.ts
│   │   │   ├── messaging.service.ts
│   │   │   └── messaging.gateway.improved.ts  # WebSocket gateway
│   │   ├── post/                     # Post system
│   │   ├── sub-community/            # Sub-community management
│   │   ├── mentorship/               # Mentorship system
│   │   ├── showcase/                 # Project showcase
│   │   ├── gamification/            # Badges and points
│   │   ├── notification/            # Notification system
│   │   ├── email/                    # Email service
│   │   ├── admin/                    # Admin controllers (document verification)
│   │   ├── test/                     # Test utilities and scripts
│   │   ├── files/                    # File upload/management
│   │   ├── events/                   # Event management
│   │   ├── engagement/               # Engagement tracking
│   │   ├── referral/                 # Referral system
│   │   ├── prisma/                   # Prisma service
│   │   └── common/                   # Shared utilities
│   ├── prisma/
│   │   └── schema.prisma             # Database schema
│   ├── data/                         # Seed scripts
│   └── uploads/                      # Uploaded files
├── frontend/                         # React Frontend
│   ├── src/
│   │   ├── components/               # Reusable components
│   │   │   ├── ChatBox.tsx           # Chat interface
│   │   │   ├── MessageList.tsx       # Message display
│   │   │   ├── MessageInput.tsx      # Message input
│   │   │   └── Navbar.tsx            # Navigation
│   │   ├── pages/                    # Page components
│   │   │   ├── Dashboard.tsx         # Main dashboard
│   │   │   ├── Admin/                 # Admin pages (document verification)
│   │   │   ├── ChatPage.tsx          # Chat page
│   │   │   ├── Connections.tsx       # Connections page
│   │   │   ├── Profile.tsx           # User profile
│   │   │   └── Posts/                # Post-related pages
│   │   ├── contexts/                 # React contexts
│   │   │   ├── AuthContext.tsx       # Authentication
│   │   │   ├── ThemeContext.tsx      # Theme management
│   │   │   └── NotificationContext.tsx
│   │   ├── hooks/                     # Custom hooks
│   │   │   └── useConnections.ts     # Connections logic
│   │   ├── services/                 # API services
│   │   │   ├── api.ts                # Axios configuration
│   │   │   └── websocket.improved.ts # WebSocket service
│   │   ├── types/                    # TypeScript types
│   │   ├── utils/                    # Utility functions
│   │   └── App.tsx                   # Main app component
│   └── public/                       # Static assets
└── README.md                         # This file
```

## 🔧 Development Workflow

### Code Quality Tools
- **Prettier** - Consistent code formatting
- **ESLint** - Code quality and style enforcement
- **Husky** - Git hooks for pre-commit checks
- **lint-staged** - Run linters on staged files
- **Commitlint** - Conventional commit message enforcement

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/your-feature-name
```

### Commit Message Format
Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test additions/changes
- `chore:` - Build/tooling changes

## 🧪 Testing

```bash
# Backend tests
cd backend
npm run test              # Unit tests
npm run test:e2e         # End-to-end tests
npm run test:cov         # Coverage report

# Frontend tests
cd frontend
npm run test             # Run tests
npm run test:coverage    # Coverage report
```

## 📊 API Documentation

The API is documented using Swagger/OpenAPI. Access the interactive documentation at:
- **Development:** http://localhost:3000/api
- **Production:** https://your-domain.com/api

### Key API Endpoints

#### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/refresh` - Refresh JWT token

#### Users
- `GET /users` - Get all users (paginated)
- `GET /users/:id` - Get user by ID
- `PUT /users/:id` - Update user profile
- `GET /users/search` - Search users

#### Connections
- `GET /connection` - Get user connections
- `POST /connection/send` - Send connection request
- `PATCH /connection/status` - Accept/reject connection
- `GET /connection/suggestions` - Get connection suggestions

#### Messaging
- `GET /messages/conversations/all` - Get all conversations
- `GET /messages/conversation/:userId` - Get conversation with user
- `POST /messages` - Send message
- `WebSocket /ws` - Real-time messaging

## 🔒 Security Features

- **JWT Authentication** with secure token handling
- **Password Hashing** using bcrypt with salt rounds
- **Domain Validation** restricting emails to @kiit.ac.in
- **CORS Protection** with configurable origins
- **Input Validation** using class-validator DTOs
- **Role-based Access Control** with guards and decorators
- **SQL Injection Prevention** via Prisma ORM
- **XSS Protection** with proper input sanitization

## 🚀 Deployment

### Backend Deployment
```bash
# Build for production
cd backend
npm run build

# Start production server
npm run start:prod
```

### Frontend Deployment
```bash
# Build for production
cd frontend
npm run build

# Serve static files
npm run preview
```

### Environment Variables for Production
Ensure all environment variables are properly configured for production:
- Database connection strings
- JWT secrets
- Email service credentials
- Google API credentials
- CORS origins

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'feat: add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines
- Follow TypeScript best practices
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Follow the existing code style

## 📝 License

This project is licensed under the UNLICENSED license - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation:** Check this README and inline code comments
- **Issues:** Open an issue on GitHub for bugs or feature requests
- **Discussions:** Use GitHub Discussions for questions and ideas

## 🙏 Acknowledgments

- KIIT University for providing the platform requirements
- All contributors who have helped build this platform
- Open source libraries and frameworks used in this project

---

**Built with ❤️ for the KIIT Community**