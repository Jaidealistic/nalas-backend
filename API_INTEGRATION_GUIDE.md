# Nalas Developer Integration Guide

This guide provides the essential information for frontend and mobile teams to integrate with the Nalas Backend.

## Base URL
- **Local**: `http://localhost:3000/api/v1`
- **Production**: (To be provided upon cloud deployment)

## Authentication
Most endpoints require a Bearer Token.

1. **Login**: `POST /auth/login`
   - Body: `{ "email": "admin@magilamfoods.com", "password": "..." }`
   - Response: `{ "accessToken": "...", "refreshToken": "..." }`
2. **Usage**: Include `Authorization: Bearer <accessToken>` in headers.

## Key Modules

### Orders
- `POST /orders`: Create a draft order.
- `GET /orders/my-orders`: View status of customer's orders.
- `POST /orders/:id/quotation`: Generate price quote (Admin only).
- `POST /orders/:id/confirm`: Confirm order and reserve stock (Admin only).

### Stock (Admin Only)
- `GET /stock/low`: Get ingredients below reorder level.
- `GET /stock/ingredients/:id/history`: View transaction audit trail.

### ML-Costing
- `POST /ml-costing/predict`: Predict cost for a menu item.
  - Body: `{ "menuItemId": "...", "quantity": 100 }`
  - Response: Detailed cost breakdown (ingredient, labor, overhead).

## Security Headers
- The backend communicates with the ML engine using an internal `X-API-Key`. Frontend teams do **not** need to worry about this.

## Error Codes
- `401`: Unauthorized (Token missing/expired).
- `403`: Forbidden (Insufficient role).
- `409`: Conflict (e.g., Email already exists).
- `400`: Bad Request (Validation failed).
