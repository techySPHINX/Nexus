# Nexus - Student & Alumni Networking Platform

## Project Description
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
    npm install
   ```

3. **Install frontend dependencies:**
   ```bash
   cd frontend
   npm install
   cd ..
    ```

### Environment Setup

1. **Create environment file:**
```bash
   cp env.example .env
```

2. **Configure environment variables:**
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

1. **Create PostgreSQL database:**
   ```sql
   CREATE DATABASE nexus_db;
   ```

2. **Run Prisma migrations:**
    ```bash
    npx prisma migrate dev --name init
    ```

3. **Generate Prisma client:**
   ```bash
   npx prisma generate
   ```

### Running the Application

1. **Start the backend server:**
    ```bash
   # Development mode
    npm run start:dev

   # Production mode
    npm run build
    npm run start:prod
   ```

2. **Start the frontend application:**
   ```bash
   cd frontend
   npm start
    ```

The application will be available at:
- **Frontend:** http://localhost:3001
- **Backend API:** http://localhost:3000

## API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login

### Users
- `GET /users` - Get all users (Admin only)
- `GET /users/:id` - Get user by ID
- `PATCH /users/:id` - Update user profile
- `DELETE /users/:id` - Delete user

### Connections
- `POST /connection/send` - Send connection request
- `PATCH /connection/status` - Update connection status
- `GET /connection` - Get user connections
- `GET /connection/pending` - Get pending requests

### Messages
- `POST /messages` - Send message
- `GET /messages/conversation/:otherUserId` - Get conversation
- `GET /messages/conversations/all` - Get all conversations

## Development

### Backend Development
    ```bash
# Run in development mode with hot reload
npm run start:dev

# Run tests
    npm run test

# Run e2e tests
npm run test:e2e

# Format code
npm run format

# Lint code
npm run lint
```

### Frontend Development
```bash
cd frontend

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

### Database Management
    ```bash
# View database in Prisma Studio
npx prisma studio

# Reset database
npx prisma migrate reset

# Create new migration
npx prisma migrate dev --name migration_name
```

## Project Structure

```
Nexus/
├── src/                    # Backend source code
│   ├── auth/              # Authentication module
│   ├── user/              # User management
│   ├── connection/        # Connection handling
│   ├── messaging/         # Messaging system
│   ├── prisma/           # Database service
│   └── common/           # Shared utilities
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── contexts/     # React contexts
│   │   └── App.tsx       # Main app component
├── prisma/               # Database schema
└── test/                 # Backend tests
```

## Security Features

- **JWT Authentication:** Secure token-based authentication
- **Password Hashing:** Bcrypt for password security
- **Domain Validation:** Email domain restriction (@kiit.ac.in)
- **CORS Protection:** Cross-origin request handling
- **Input Validation:** Comprehensive request validation
- **Role-based Access:** Granular permission control

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the UNLICENSED license.

## Support

For support and questions, please open an issue in the repository.