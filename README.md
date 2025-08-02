# Nexus Backend

## Project Description
The Nexus Backend is a robust and scalable API built with NestJS, designed to power a social networking or community platform. It provides core functionalities such as user authentication, user profile management, connection handling, and real-time messaging capabilities. Leveraging PostgreSQL as its database and Prisma as the ORM, this backend ensures efficient data management and a secure, high-performance foundation for your application.

## Features
- **User Authentication:** Secure user registration, login, and session management using JWT (JSON Web Tokens).
- **User Management:** Create, retrieve, update, and delete user profiles.
- **Connection Management:** Functionality to send, accept, reject, and block connection requests between users.
- **Messaging:** Real-time or asynchronous messaging between connected users.
- **Prisma ORM:** Type-safe database access and migrations with PostgreSQL.
- **Modular Architecture:** Organized and scalable codebase using NestJS modules.

## Technologies Used
- **[NestJS](https://nestjs.com/):** A progressive Node.js framework for building efficient, reliable, and scalable server-side applications.
- **[TypeScript](https://www.typescriptlang.org/):** A typed superset of JavaScript that compiles to plain JavaScript.
- **[Prisma](https://www.prisma.io/):** A next-generation ORM that makes database access easy and type-safe.
- **[PostgreSQL](https://www.postgresql.org/):** A powerful, open-source object-relational database system.
- **[JWT (JSON Web Tokens)](https://jwt.io/):** For secure authentication and authorization.
- **[Bcrypt](https://www.npmjs.com/package/bcrypt):** For hashing passwords securely.

## Getting Started

### Prerequisites
Before you begin, ensure you have the following installed:
- **Node.js** (LTS version recommended)
- **npm** or **Yarn** (npm is used in the examples)
- **PostgreSQL** database server

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/nexus-backend.git
    cd nexus-backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

### Environment Variables
Create a `.env` file in the root of the project based on the `.env.example` file.

```bash
cp .env.example .env
```

Open the newly created `.env` file and update the variables:

```dotenv
# The connection string for your PostgreSQL database
DATABASE_URL="postgresql://user:password@localhost:5432/mydatabase"

# A secret key for signing JWT tokens.
# This should be a long, random string. Generate one using a tool or a random string generator.
JWT_SECRET="your-super-secret-and-long-string"

# The port the application will run on
PORT=3000
```
**Note:** For `JWT_SECRET`, ensure you use a strong, randomly generated string for production environments.

### Database Setup

1.  **Run Prisma migrations:** This will create the necessary tables in your PostgreSQL database.
    ```bash
    npx prisma migrate dev --name init
    ```
    If you make changes to `prisma/schema.prisma`, you will need to run this command again to apply the migrations.

### Running the Application

-   **Development Mode (with watch):**
    ```bash
    npm run start:dev
    # or
    yarn start:dev
    ```
    The application will reload automatically on code changes.

-   **Production Mode:**
    ```bash
    npm run build
    npm run start:prod
    # or
    yarn build
    yarn start:prod
    ```

The application will typically run on `http://localhost:3000` (or the `PORT` you specified in your `.env` file).

## API Endpoints
Once the application is running, you can access the API. Detailed API documentation (e.g., Swagger UI) can be integrated for a comprehensive list of endpoints and their usage.

Common base paths might include:
-   `/auth` for authentication-related endpoints (register, login)
-   `/users` for user profile management
-   `/connections` for managing user connections
-   `/messages` for messaging functionalities

## Testing
To run the automated tests:

-   **Unit and Integration Tests:**
    ```bash
    npm run test
    # or
    yarn test
    ```

-   **End-to-End Tests:**
    ```bash
    npm run test:e2e
    # or
    yarn test:e2e
    ```

## License
This project is licensed under the UNLICENSED license. See the `LICENSE` file for details.