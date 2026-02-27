# Magilam Foods Backend Documentation

## Overview
The **Magilam Foods Backend** is a robust RESTful API built to manage the core operations of the Magilam Foods catering service. It handles Authentication, Order Management, Stock Control, Menu Planning, Billing, and ML-based Costing predictions.

##  Project Structure
The project follows a modular architecture for better scalability and maintainability.

```
src/
├── config/           # Database (PostgreSQL) and Swagger configuration
├── middlewares/      # Core middlewares
│   ├── auth.middleware.js   # JWT Authentication
│   ├── error.middleware.js  # Global Error Handling
│   ├── rbac.middleware.js   # Role-Based Access Control
│   └── validate.middleware.js # Joi Request Validation
├── modules/          # Feature-based modules
│   ├── auth/         # User authentication & profile
│   ├── billing/      # Quotations, Invoices, Payments
│   ├── menu/         # Categories, Items, Recipes
│   ├── ml-costing/   # Cost predictions & Analytics
│   ├── orders/       # Order processing & Status tracking
│   └── stock/        # Ingredient inventory & Alerts
├── shared/           # Shared utilities (Logger, AppError)
├── tests/            # Integration & Unit tests (Jest/Supertest)
└── app.js            # Express application entry point
```

## Technology Stack
-   **Runtime:** Node.js
-   **Framework:** Express.js
-   **Database:** PostgreSQL (`pg` library)
-   **Authentication:** JWT (JSON Web Tokens)
-   **Validation:** Joi
-   **Documentation:** Swagger UI / OpenAPI 3.0
-   **Testing:** Jest, Supertest
-   **Logging:** Winston

##  Setup & Installation
1.  **Clone the repository** and navigate to the directory.
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Configure Environment Variables (`.env`):**
    ```env
    PORT=3000
    DB_USER=postgres
    DB_PASSWORD=yourpassword
    DB_HOST=localhost
    DB_NAME=magilam_foods
    JWT_SECRET=supersecretkey
    ```
4.  **Run the Server:**
    -   Development: `npm run dev`
    -   Production: `npm start`
5.  **Run Tests:**
    ```bash
    npm test
    ```

## 🔌 API Endpoints
The API is divided into several modules. Below is a summary of key endpoints.

###  Authentication (`/api/v1/auth`)
-   `POST /register` - Register a new user (Customer).
-   `POST /login` - Login and receive a JWT token.

###  Orders (`/api/v1/orders`)
-   `POST /` - Create a new draft order.
-   `GET /` - List all orders (Admin/Manager).
-   `GET /:id` - Get order details.
-   `PUT /:id/status` - Update order status (e.g., `confirmed`, `completed`).

###  Stock (`/api/v1/stock`)
-   `GET /ingredients` - List all ingredients.
-   `POST /transactions` - Record purchase, consumption, or wastage.
-   `GET /current` - View current stock levels.
-   `GET /alerts/procurement` - Get low-stock alerts.

###  Menu (`/api/v1/menu`)
-   `GET /categories` - List menu categories.
-   `POST /items` - Add a new menu item.
-   `GET /items/:id/recipe` - Get recipe details for an item.

###  Billing (`/api/v1/billing`)
-   `POST /quotations` - Generate a price quotation for an order.
-   `POST /invoices` - Create a final invoice from an order.
-   `POST /payments` - Record a payment against an invoice.

###  ML Costing (`/api/v1/ml-costing`)
-   `POST /predictions` - Predict costs for an order item using ML models.
-   `GET /analytics` - Retrieve cost analytics and profit margins.
-   `GET /trends` - View cost trends over time.

##  Error Handling
The API uses standardized error responses:
-   **400 Bad Request:** Invalid input syntax.
-   **401 Unauthorized:** Missing or invalid JWT token.
-   **403 Forbidden:** valid token but insufficient permissions.
-   **404 Not Found:** Resource does not exist.
-   **422 Unprocessable Entity:** Validation failure (e.g., missing required fields).
-   **500 Internal Server Error:** Unexpected server failure.
