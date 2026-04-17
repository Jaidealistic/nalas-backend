# Implementation Plan: Client Demo with Real NRC Datasets

This plan outlines the steps to prepare and verify a full end-to-end demo of the Nalas system using real catering datasets.

## User Review Required

> [!IMPORTANT]
> **Admin Credentials**: I will reset the password for `admin@magilamfoods.com` to `Admin@123` so we can log in to the dashboard during the demo.

## Proposed Changes

### 1. Backend Service Preparation
- **File**: `nalas-backend/.env`
- **Action**: Ensure `ML_SERVICE_URL=http://localhost:8001` is set.

### 2. Frontend Integration
- **Folder**: `nalas_app/frontendadmin`
- **Action**: Create `.env.local` to point the UI to the backend.

---

## Verification Plan (The Demo Flow)

1. **Start Services**: ML (8001), Backend (3000), Frontend (3001).
2. **Login**: Use `admin@magilamfoods.com` / `Admin@123`.
3. **Showcase**:
   - Real NRC ingredients/prices.
   - ML-driven costing for a real recipe (e.g., Mutton Varuval).
4. **Validation**: Confirm stock reservations and rollbacks work as expected.
