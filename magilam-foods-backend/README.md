# Magilam Foods Backend

A comprehensive backend service for the Magilam Foods catering management system, built with Node.js, Express, and PostgreSQL.

## 📋 Features

- **Authentication & RBAC**: Secure user registration, login, and role-based access control (Admin, Super Admin, User).
- **Menu Management**: Create and manage menu categories, items, and recipes.
- **Stock Management**: Track ingredient inventory, procurement, and usage.
- **Order Management**: Handle event orders, from inquiry to completion.
- **API Documentation**: Interactive Swagger UI documentation.
- **Testing**: validation and contract testing with Jest and Supertest.

## 🚀 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM/Query**: `pg` (node-postgres)
- **Validation**: Joi
- **Testing**: Jest, Supertest, jest-openapi
- **Documentation**: Swagger UI
- **Logging**: Winston

## 🛠️ Prerequisites

- [Node.js](https://nodejs.org/) (v16+ recommended)
- [PostgreSQL](https://www.postgresql.org/) (v13+)
- [npm](https://www.npmjs.com/)

## 📦 Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd magilam-foods-backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Setup:**
    Create a `.env` file in the root directory (copy from `.env.example` if available) and configure your database and JWT secret:
    ```env
    PORT=3000
    NODE_ENV=development
    
    # Database
    DB_USER=your_db_user
    DB_PASSWORD=your_db_password
    DB_HOST=localhost
    DB_PORT=5432
    DB_NAME=magilam_foods
    
    # Security
    JWT_SECRET=your_super_secret_jwt_key
    JWT_EXPIRES_IN=1d
    ```

4.  **Database Migration:**
    Ensure your PostgreSQL database is running and the `magilam_foods` database exists. Run the SQL scripts in `src/database/schema.sql` (if applicable) to set up tables.

## 🏃‍♂️ Running the Server

### Development Mode
Runs the server with `nodemon` for hot-reloading:
```bash
npm run dev
```
The server will start at `http://localhost:3000`.

### Production Mode
```bash
npm start
```

## 🧪 Running Tests

Execute the full test suite (Unit, Integration, Contract):
```bash
npm test
```

Run specific test files:
```bash
npx jest src/tests/auth.test.js
```

## 📚 API Documentation

Once the server is running, you can access the interactive API documentation at:

**[http://localhost:3000/api-docs](http://localhost:3000/api-docs)**

This Swagger UI allows you to explore endpoints, schemas, and test requests directly.

## 📂 Project Structure

```
src/
├── config/         # Database and app configuration
├── middlewares/    # Auth, validation, error handling
├── modules/        # Feature modules (Auth, Menu, Stock, Orders)
│   ├── controller.js
│   ├── routes.js
│   ├── service.js
│   ├── repository.js
│   └── validators.js
├── shared/         # Shared utilities and error classes
├── tests/          # Jest test files
└── app.js          # App entry point
```

## 📄 License

ISC
